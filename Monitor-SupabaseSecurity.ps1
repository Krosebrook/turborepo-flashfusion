# PowerShell Script for Continuous Supabase Security Monitoring
# Monitors your Supabase instance for security issues and alerts

param(
    [Parameter(Mandatory=$false)]
    [string]$SupabaseUrl = "postgres://postgres.jrsnynybbmpkvrgqlubk:WV40CMbCP473da3H@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require",

    [Parameter(Mandatory=$false)]
    [int]$CheckIntervalMinutes = 30,

    [Parameter(Mandatory=$false)]
    [switch]$Continuous,

    [Parameter(Mandatory=$false)]
    [string]$LogPath = ".\SupabaseSecurityLog.txt",

    [Parameter(Mandatory=$false)]
    [switch]$SendAlerts,

    [Parameter(Mandatory=$false)]
    [string]$WebhookUrl = ""  # Optional Discord/Slack webhook for alerts
)

# Security thresholds
$thresholds = @{
    MaxTablesWithoutRLS = 0
    MaxTablesWithoutPolicies = 2
    MaxPublicBuckets = 1
    MaxAnonFunctions = 5
    MaxFailedLogins = 10  # per hour
    MaxAPIErrors = 50     # per hour
}

# Initialize monitoring
$script:lastCheck = @{}
$script:alertsSent = @{}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp [$Level] $Message"

    # Console output with colors
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "SUCCESS" { "Green" }
        "ALERT" { "Magenta" }
        default { "White" }
    }

    Write-Host $logEntry -ForegroundColor $color

    # File logging
    if ($LogPath) {
        $logEntry | Add-Content -Path $LogPath
    }
}

function Send-Alert {
    param(
        [string]$Title,
        [string]$Message,
        [string]$Severity = "warning"
    )

    Write-Log -Message "ALERT: $Title - $Message" -Level "ALERT"

    # Send to webhook if configured
    if ($SendAlerts -and $WebhookUrl) {
        try {
            $color = switch ($Severity) {
                "critical" { 16711680 }  # Red
                "warning" { 16776960 }   # Yellow
                "info" { 65280 }         # Green
                default { 8421504 }      # Gray
            }

            $payload = @{
                embeds = @(
                    @{
                        title = "🔐 Supabase Security Alert: $Title"
                        description = $Message
                        color = $color
                        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                        fields = @(
                            @{
                                name = "Severity"
                                value = $Severity.ToUpper()
                                inline = $true
                            }
                            @{
                                name = "Time"
                                value = (Get-Date -Format "HH:mm:ss")
                                inline = $true
                            }
                        )
                    }
                )
            }

            $json = $payload | ConvertTo-Json -Depth 10
            Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $json -ContentType "application/json"
            Write-Log -Message "Alert sent to webhook" -Level "SUCCESS"
        }
        catch {
            Write-Log -Message "Failed to send webhook alert: $_" -Level "ERROR"
        }
    }
}

function Get-PSQLPath {
    try {
        $psql = Get-Command psql -ErrorAction Stop
        return $psql.Source
    }
    catch {
        $paths = @(
            "C:\Program Files\PostgreSQL\*\bin\psql.exe",
            "C:\Users\$env:USERNAME\PostgreSQL\*\bin\psql.exe"
        )
        foreach ($path in $paths) {
            $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) {
                return $found.FullName
            }
        }
        return $null
    }
}

function Invoke-SQLQuery {
    param(
        [string]$Query,
        [string]$Database = $SupabaseUrl
    )

    try {
        if ($script:psqlPath) {
            $result = & "$script:psqlPath" $Database -c $Query -t -A 2>&1
        } else {
            $result = psql $Database -c $Query -t -A 2>&1
        }

        if ($result -match "ERROR:") {
            throw $result
        }

        return $result
    }
    catch {
        Write-Log -Message "SQL Error: $_" -Level "ERROR"
        return $null
    }
}

function Check-SecurityMetrics {
    $metrics = @{}

    # Check tables without RLS
    $rlsQuery = @"
SELECT COUNT(*)
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys');
"@
    $metrics.TablesWithoutRLS = [int](Invoke-SQLQuery -Query $rlsQuery)

    # Check tables without policies
    $policyQuery = @"
SELECT COUNT(DISTINCT t.tablename)
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.tablename = t.tablename AND p.schemaname = t.schemaname
);
"@
    $metrics.TablesWithoutPolicies = [int](Invoke-SQLQuery -Query $policyQuery)

    # Check public buckets
    $bucketQuery = "SELECT COUNT(*) FROM storage.buckets WHERE public = true;"
    $metrics.PublicBuckets = [int](Invoke-SQLQuery -Query $bucketQuery)

    # Check anon accessible functions
    $functionQuery = @"
SELECT COUNT(*)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND has_function_privilege('anon', p.oid, 'EXECUTE');
"@
    $metrics.AnonFunctions = [int](Invoke-SQLQuery -Query $functionQuery)

    # Check recent failed authentication attempts (if auth logs available)
    $authQuery = @"
SELECT COUNT(*)
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '1 hour'
AND payload->>'event_message' LIKE '%failed%';
"@
    $authResult = Invoke-SQLQuery -Query $authQuery
    $metrics.FailedLogins = if ($authResult) { [int]$authResult } else { 0 }

    # Check audit log size
    $auditQuery = @"
SELECT COUNT(*), MAX(changed_at) as latest
FROM public.audit_log
WHERE changed_at > NOW() - INTERVAL '1 hour';
"@
    $auditResult = Invoke-SQLQuery -Query $auditQuery
    if ($auditResult -and $auditResult -match '\|') {
        $parts = $auditResult -split '\|'
        $metrics.RecentAuditEntries = [int]$parts[0]
    }

    return $metrics
}

function Check-Thresholds {
    param($Metrics)

    $violations = @()

    if ($Metrics.TablesWithoutRLS -gt $thresholds.MaxTablesWithoutRLS) {
        $violations += @{
            Type = "RLS"
            Message = "$($Metrics.TablesWithoutRLS) tables without Row Level Security"
            Severity = "critical"
        }
    }

    if ($Metrics.TablesWithoutPolicies -gt $thresholds.MaxTablesWithoutPolicies) {
        $violations += @{
            Type = "Policy"
            Message = "$($Metrics.TablesWithoutPolicies) tables without security policies"
            Severity = "warning"
        }
    }

    if ($Metrics.PublicBuckets -gt $thresholds.MaxPublicBuckets) {
        $violations += @{
            Type = "Storage"
            Message = "$($Metrics.PublicBuckets) public storage buckets detected"
            Severity = "warning"
        }
    }

    if ($Metrics.AnonFunctions -gt $thresholds.MaxAnonFunctions) {
        $violations += @{
            Type = "Functions"
            Message = "$($Metrics.AnonFunctions) functions accessible by anonymous users"
            Severity = "warning"
        }
    }

    if ($Metrics.FailedLogins -gt $thresholds.MaxFailedLogins) {
        $violations += @{
            Type = "Authentication"
            Message = "$($Metrics.FailedLogins) failed login attempts in the last hour"
            Severity = "critical"
        }
    }

    return $violations
}

function Show-Dashboard {
    param($Metrics, $Violations)

    Clear-Host
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║       🔐 SUPABASE SECURITY MONITORING DASHBOARD 🔐        ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "Last Check: $timestamp" -ForegroundColor Gray
    Write-Host ""

    # Security Metrics
    Write-Host "📊 SECURITY METRICS" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray

    $rlsColor = if ($Metrics.TablesWithoutRLS -eq 0) { "Green" } else { "Red" }
    Write-Host "  Tables without RLS:      " -NoNewline
    Write-Host "$($Metrics.TablesWithoutRLS)" -ForegroundColor $rlsColor

    $policyColor = if ($Metrics.TablesWithoutPolicies -le $thresholds.MaxTablesWithoutPolicies) { "Green" } else { "Yellow" }
    Write-Host "  Tables without Policies: " -NoNewline
    Write-Host "$($Metrics.TablesWithoutPolicies)" -ForegroundColor $policyColor

    $bucketColor = if ($Metrics.PublicBuckets -le $thresholds.MaxPublicBuckets) { "Green" } else { "Yellow" }
    Write-Host "  Public Storage Buckets:  " -NoNewline
    Write-Host "$($Metrics.PublicBuckets)" -ForegroundColor $bucketColor

    $funcColor = if ($Metrics.AnonFunctions -le $thresholds.MaxAnonFunctions) { "Green" } else { "Yellow" }
    Write-Host "  Anon-accessible Functions: " -NoNewline
    Write-Host "$($Metrics.AnonFunctions)" -ForegroundColor $funcColor

    $loginColor = if ($Metrics.FailedLogins -le $thresholds.MaxFailedLogins) { "Green" } else { "Red" }
    Write-Host "  Failed Logins (1hr):    " -NoNewline
    Write-Host "$($Metrics.FailedLogins)" -ForegroundColor $loginColor

    Write-Host ""

    # Violations
    if ($Violations.Count -gt 0) {
        Write-Host "⚠️  SECURITY VIOLATIONS" -ForegroundColor Red
        Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray

        foreach ($violation in $Violations) {
            $symbol = if ($violation.Severity -eq "critical") { "❌" } else { "⚠️" }
            $color = if ($violation.Severity -eq "critical") { "Red" } else { "Yellow" }

            Write-Host "  $symbol " -NoNewline -ForegroundColor $color
            Write-Host $violation.Message -ForegroundColor $color
        }
    } else {
        Write-Host "✅ SECURITY STATUS: " -NoNewline -ForegroundColor Green
        Write-Host "ALL CHECKS PASSED" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray
}

# Main execution
Write-Log -Message "Starting Supabase Security Monitor" -Level "SUCCESS"

# Check for psql
$script:psqlPath = Get-PSQLPath
if (-not $script:psqlPath) {
    Write-Log -Message "PostgreSQL client not found. Install psql to run monitor." -Level "ERROR"
    exit 1
}

Write-Log -Message "Using PostgreSQL client at: $script:psqlPath" -Level "INFO"

# Main monitoring loop
$iterationCount = 0

do {
    $iterationCount++

    try {
        # Get current metrics
        $metrics = Check-SecurityMetrics

        # Check for violations
        $violations = Check-Thresholds -Metrics $metrics

        # Display dashboard
        if (-not $Continuous) {
            Show-Dashboard -Metrics $metrics -Violations $violations
        } else {
            # In continuous mode, show a simpler output
            $status = if ($violations.Count -eq 0) { "✅ SECURE" } else { "⚠️  VIOLATIONS: $($violations.Count)" }
            Write-Log -Message "Check #$iterationCount - $status" -Level $(if ($violations.Count -eq 0) { "SUCCESS" } else { "WARNING" })
        }

        # Send alerts for new violations
        foreach ($violation in $violations) {
            $alertKey = "$($violation.Type)_$($violation.Message)"

            # Check if we've already sent this alert recently
            if (-not $script:alertsSent.ContainsKey($alertKey) -or
                (Get-Date) -gt $script:alertsSent[$alertKey].AddHours(1)) {

                Send-Alert -Title $violation.Type -Message $violation.Message -Severity $violation.Severity
                $script:alertsSent[$alertKey] = Get-Date
            }
        }

        # Store last check results
        $script:lastCheck = $metrics

    }
    catch {
        Write-Log -Message "Error during security check: $_" -Level "ERROR"
    }

    if ($Continuous) {
        Write-Log -Message "Waiting $CheckIntervalMinutes minutes until next check..." -Level "INFO"
        Start-Sleep -Seconds ($CheckIntervalMinutes * 60)
    }

} while ($Continuous)

Write-Log -Message "Security monitoring completed" -Level "SUCCESS"

# Generate final report if not continuous
if (-not $Continuous) {
    Write-Host ""
    Write-Host "💡 Tips:" -ForegroundColor Cyan
    Write-Host "  • Run with -Continuous flag for ongoing monitoring" -ForegroundColor Gray
    Write-Host "  • Use -SendAlerts and -WebhookUrl to get notifications" -ForegroundColor Gray
    Write-Host "  • Check $LogPath for detailed logs" -ForegroundColor Gray
    Write-Host ""
}