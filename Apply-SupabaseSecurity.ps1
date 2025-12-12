# PowerShell Script to Apply Supabase Security Fixes
# Requires: PostgreSQL client (psql) installed

param(
    [Parameter(Mandatory=$false)]
    [string]$SupabaseUrl = "postgres://postgres.jrsnynybbmpkvrgqlubk:WV40CMbCP473da3H@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require",

    [Parameter(Mandatory=$false)]
    [string]$SqlFile = "fix_supabase_warnings.sql",

    [Parameter(Mandatory=$false)]
    [switch]$Comprehensive,

    [Parameter(Mandatory=$false)]
    [switch]$CheckOnly
)

# Colors for output
$ErrorActionPreference = "Stop"

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-WarningMsg {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

# Check if psql is installed
function Test-PostgreSQL {
    try {
        $psqlPath = Get-Command psql -ErrorAction Stop
        Write-Success "PostgreSQL client found at: $($psqlPath.Source)"
        return $true
    }
    catch {
        Write-ErrorMsg "PostgreSQL client (psql) not found!"
        Write-Info "Install PostgreSQL or add it to PATH"
        Write-Info "Download from: https://www.postgresql.org/download/windows/"

        # Check common PostgreSQL installation paths
        $commonPaths = @(
            "C:\Program Files\PostgreSQL\*\bin\psql.exe",
            "C:\PostgreSQL\*\bin\psql.exe",
            "C:\Users\$env:USERNAME\PostgreSQL\*\bin\psql.exe"
        )

        foreach ($path in $commonPaths) {
            $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
            if ($found) {
                Write-Info "Found psql at: $($found[0].FullName)"
                Write-Info "Add this to PATH: $($found[0].DirectoryName)"
                $global:psqlPath = $found[0].FullName
                return $true
            }
        }

        return $false
    }
}

# Function to run SQL file
function Invoke-SQLFile {
    param(
        [string]$FilePath,
        [string]$DatabaseUrl
    )

    if (-not (Test-Path $FilePath)) {
        Write-ErrorMsg "SQL file not found: $FilePath"
        return $false
    }

    Write-Info "Executing SQL file: $FilePath"

    try {
        if ($global:psqlPath) {
            $result = & "$global:psqlPath" $DatabaseUrl -f $FilePath 2>&1
        } else {
            $result = psql $DatabaseUrl -f $FilePath 2>&1
        }

        # Check for errors in output
        $errorLines = $result | Where-Object { $_ -match "ERROR:" }
        if ($errorLines) {
            Write-WarningMsg "Some errors occurred:"
            $errorLines | ForEach-Object { Write-WarningMsg $_ }
        }

        # Show notices
        $noticeLines = $result | Where-Object { $_ -match "NOTICE:" }
        if ($noticeLines) {
            $noticeLines | ForEach-Object { Write-Info $_.Replace("NOTICE:", "").Trim() }
        }

        Write-Success "SQL file executed successfully"
        return $true
    }
    catch {
        Write-ErrorMsg "Failed to execute SQL: $_"
        return $false
    }
}

# Function to run SQL command
function Invoke-SQLCommand {
    param(
        [string]$Command,
        [string]$DatabaseUrl
    )

    try {
        if ($global:psqlPath) {
            $result = & "$global:psqlPath" $DatabaseUrl -c $Command -t 2>&1
        } else {
            $result = psql $DatabaseUrl -c $Command -t 2>&1
        }
        return $result
    }
    catch {
        Write-ErrorMsg "Failed to execute SQL command: $_"
        return $null
    }
}

# Function to check security status
function Get-SecurityStatus {
    param([string]$DatabaseUrl)

    Write-Info "Checking current security status..."

    $checkQuery = @'
WITH security_check AS (
    SELECT
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) as no_rls,
        (SELECT COUNT(*) FROM pg_tables t WHERE schemaname = 'public' AND rowsecurity = true
         AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename)) as no_policies,
        (SELECT COUNT(*) FROM storage.buckets WHERE public = true) as public_buckets,
        (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
         WHERE n.nspname = 'public' AND has_function_privilege('anon', p.oid, 'EXECUTE')) as anon_functions
)
SELECT
    no_rls,
    no_policies,
    public_buckets,
    anon_functions,
    CASE WHEN no_rls + no_policies + public_buckets + anon_functions = 0
         THEN 'PASS'
         ELSE 'FAIL'
    END as status
FROM security_check;
'@

    $result = Invoke-SQLCommand -Command $checkQuery -DatabaseUrl $DatabaseUrl

    if ($result) {
        $values = $result.Trim() -split '\|'
        if ($values.Length -ge 5) {
            $status = @{
                TablesWithoutRLS = [int]$values[0].Trim()
                TablesWithoutPolicies = [int]$values[1].Trim()
                PublicBuckets = [int]$values[2].Trim()
                AnonFunctions = [int]$values[3].Trim()
                Status = $values[4].Trim()
            }

            Write-Host ""
            Write-Host "Security Status Report" -ForegroundColor White -BackgroundColor DarkBlue
            Write-Host "======================" -ForegroundColor Blue

            if ($status.TablesWithoutRLS -gt 0) {
                Write-WarningMsg "Tables without RLS: $($status.TablesWithoutRLS)"
            } else {
                Write-Success "All tables have RLS enabled"
            }

            if ($status.TablesWithoutPolicies -gt 0) {
                Write-WarningMsg "Tables without policies: $($status.TablesWithoutPolicies)"
            } else {
                Write-Success "All tables have policies"
            }

            if ($status.PublicBuckets -gt 0) {
                Write-WarningMsg "Public storage buckets: $($status.PublicBuckets)"
            } else {
                Write-Success "No public storage buckets"
            }

            if ($status.AnonFunctions -gt 0) {
                Write-WarningMsg "Functions accessible by anon: $($status.AnonFunctions)"
            } else {
                Write-Success "Functions properly secured"
            }

            Write-Host ""
            if ($status.Status -eq "PASS") {
                Write-Success "Overall Status: ALL SECURITY CHECKS PASSED!"
            } else {
                Write-WarningMsg "Overall Status: SECURITY ISSUES FOUND"
            }

            return $status
        }
    }

    Write-ErrorMsg "Could not retrieve security status"
    return $null
}

# Main execution
Write-Host ""
Write-Host "🔐 Supabase Security Fix Tool" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host "==============================" -ForegroundColor Green
Write-Host ""

# Check PostgreSQL
if (-not (Test-PostgreSQL)) {
    exit 1
}

# Get initial security status
$initialStatus = Get-SecurityStatus -DatabaseUrl $SupabaseUrl

if ($CheckOnly) {
    Write-Info "Check-only mode - no changes made"
    exit 0
}

# Ask for confirmation
Write-Host ""
Write-WarningMsg "This will modify your database security settings"
Write-Host "Do you want to continue? (Y/N): " -NoNewline
$confirmation = Read-Host

if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Info "Operation cancelled"
    exit 0
}

# Apply fixes
Write-Host ""
if ($Comprehensive) {
    Write-Info "Applying comprehensive security fixes..."
    $sqlFile = "supabase_security_comprehensive_fixes.sql"
} else {
    Write-Info "Applying basic security fixes..."
    $sqlFile = "fix_supabase_warnings.sql"
}

if (Invoke-SQLFile -FilePath $sqlFile -DatabaseUrl $SupabaseUrl) {
    Write-Host ""
    Write-Success "Security fixes applied successfully!"

    # Wait a moment for changes to propagate
    Start-Sleep -Seconds 2

    # Check security status after fixes
    Write-Host ""
    Write-Info "Verifying security improvements..."
    $finalStatus = Get-SecurityStatus -DatabaseUrl $SupabaseUrl

    if ($initialStatus -and $finalStatus) {
        Write-Host ""
        Write-Host "Improvements Made:" -ForegroundColor White -BackgroundColor DarkGreen

        $rlsFixed = $initialStatus.TablesWithoutRLS - $finalStatus.TablesWithoutRLS
        $policiesAdded = $initialStatus.TablesWithoutPolicies - $finalStatus.TablesWithoutPolicies
        $bucketsSecured = $initialStatus.PublicBuckets - $finalStatus.PublicBuckets
        $functionsSecured = $initialStatus.AnonFunctions - $finalStatus.AnonFunctions

        if ($rlsFixed -gt 0) { Write-Success "$rlsFixed tables now have RLS enabled" }
        if ($policiesAdded -gt 0) { Write-Success "$policiesAdded tables now have policies" }
        if ($bucketsSecured -gt 0) { Write-Success "$bucketsSecured storage buckets secured" }
        if ($functionsSecured -gt 0) { Write-Success "$functionsSecured functions secured" }
    }

    Write-Host ""
    Write-Info "Next steps:"
    Write-Info "1. Test your application to ensure policies work correctly"
    Write-Info "2. Review and customize the generated policies"
    Write-Info "3. Enable 2FA in Supabase Dashboard"
    Write-Info "4. Rotate API keys if needed"
} else {
    Write-ErrorMsg "Failed to apply security fixes"
    exit 1
}

Write-Host ""
Write-Success "Security fix process completed!"