# PowerShell Script to Test Supabase Security Configuration
# Tests various security aspects of your Supabase setup

param(
    [Parameter(Mandatory=$false)]
    [string]$SupabaseUrl = "postgres://postgres.jrsnynybbmpkvrgqlubk:WV40CMbCP473da3H@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require",

    [Parameter(Mandatory=$false)]
    [switch]$Verbose,

    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport
)

# Initialize test results
$testResults = @()
$passedTests = 0
$failedTests = 0
$warnings = 0

function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Status,
        [string]$Message
    )

    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        default { "White" }
    }

    $symbol = switch ($Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "WARN" { "⚠️" }
        default { "ℹ️" }
    }

    Write-Host "$symbol [$Status] $TestName" -ForegroundColor $color
    if ($Message -and ($Verbose -or $Status -ne "PASS")) {
        Write-Host "   $Message" -ForegroundColor Gray
    }

    # Track results
    $script:testResults += [PSCustomObject]@{
        TestName = $TestName
        Status = $Status
        Message = $Message
        Timestamp = Get-Date
    }

    switch ($Status) {
        "PASS" { $script:passedTests++ }
        "FAIL" { $script:failedTests++ }
        "WARN" { $script:warnings++ }
    }
}

function Test-PostgreSQLClient {
    try {
        $psql = Get-Command psql -ErrorAction Stop
        return $psql.Source
    }
    catch {
        # Check common paths
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
        if ($Verbose) {
            Write-Host "SQL Error: $_" -ForegroundColor Red
        }
        return $null
    }
}

# Initialize
Write-Host ""
Write-Host "🔒 Supabase Security Test Suite" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "================================" -ForegroundColor Blue
Write-Host ""

# Check psql availability
$script:psqlPath = Test-PostgreSQLClient
if (-not $script:psqlPath) {
    Write-Host "PostgreSQL client not found. Install psql to run tests." -ForegroundColor Red
    exit 1
}

Write-Host "Starting security tests..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check RLS on all public tables
Write-Host "[ Row Level Security Tests ]" -ForegroundColor Yellow
$rlsQuery = @"
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
ORDER BY tablename;
"@

$rlsResults = Invoke-SQLQuery -Query $rlsQuery
if ($rlsResults) {
    $tables = $rlsResults -split "`n" | Where-Object { $_ -match '\|' }
    $tablesWithoutRLS = @()

    foreach ($table in $tables) {
        $parts = $table -split '\|'
        if ($parts.Length -eq 2) {
            $tableName = $parts[0].Trim()
            $hasRLS = $parts[1].Trim() -eq 't'

            if ($hasRLS) {
                Write-TestResult -TestName "RLS on table '$tableName'" -Status "PASS" -Message "RLS is enabled"
            } else {
                Write-TestResult -TestName "RLS on table '$tableName'" -Status "FAIL" -Message "RLS is NOT enabled - security risk!"
                $tablesWithoutRLS += $tableName
            }
        }
    }

    if ($tablesWithoutRLS.Count -eq 0) {
        Write-TestResult -TestName "Overall RLS Status" -Status "PASS" -Message "All tables have RLS enabled"
    } else {
        Write-TestResult -TestName "Overall RLS Status" -Status "FAIL" -Message "$($tablesWithoutRLS.Count) tables without RLS: $($tablesWithoutRLS -join ', ')"
    }
}

Write-Host ""

# Test 2: Check for policies on RLS-enabled tables
Write-Host "[ Policy Configuration Tests ]" -ForegroundColor Yellow
$policyQuery = @"
SELECT DISTINCT t.tablename, COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' AND t.rowsecurity = true
GROUP BY t.tablename
ORDER BY t.tablename;
"@

$policyResults = Invoke-SQLQuery -Query $policyQuery
if ($policyResults) {
    $tablesWithoutPolicies = @()
    $lines = $policyResults -split "`n" | Where-Object { $_ -match '\|' }

    foreach ($line in $lines) {
        $parts = $line -split '\|'
        if ($parts.Length -eq 2) {
            $tableName = $parts[0].Trim()
            $policyCount = [int]$parts[1].Trim()

            if ($policyCount -gt 0) {
                Write-TestResult -TestName "Policies on '$tableName'" -Status "PASS" -Message "$policyCount policies defined"
            } else {
                Write-TestResult -TestName "Policies on '$tableName'" -Status "WARN" -Message "RLS enabled but no policies - blocks all access!"
                $tablesWithoutPolicies += $tableName
            }
        }
    }
}

Write-Host ""

# Test 3: Check anonymous function access
Write-Host "[ Function Security Tests ]" -ForegroundColor Yellow
$functionQuery = @"
SELECT p.proname, n.nspname
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND has_function_privilege('anon', p.oid, 'EXECUTE')
LIMIT 10;
"@

$functionResults = Invoke-SQLQuery -Query $functionQuery
if ($functionResults) {
    $anonFunctions = $functionResults -split "`n" | Where-Object { $_ -match '\|' }

    if ($anonFunctions.Count -eq 0) {
        Write-TestResult -TestName "Anonymous function access" -Status "PASS" -Message "No functions accessible by anonymous users"
    } else {
        foreach ($func in $anonFunctions) {
            $parts = $func -split '\|'
            if ($parts.Length -eq 2) {
                $funcName = $parts[0].Trim()
                Write-TestResult -TestName "Function '$funcName'" -Status "WARN" -Message "Accessible by anonymous users"
            }
        }
    }
}

Write-Host ""

# Test 4: Check storage bucket configuration
Write-Host "[ Storage Security Tests ]" -ForegroundColor Yellow
$bucketQuery = @"
SELECT name, public, created_at
FROM storage.buckets;
"@

$bucketResults = Invoke-SQLQuery -Query $bucketQuery
if ($bucketResults) {
    $buckets = $bucketResults -split "`n" | Where-Object { $_ -match '\|' }

    foreach ($bucket in $buckets) {
        $parts = $bucket -split '\|'
        if ($parts.Length -ge 2) {
            $bucketName = $parts[0].Trim()
            $isPublic = $parts[1].Trim() -eq 't'

            if ($isPublic) {
                Write-TestResult -TestName "Storage bucket '$bucketName'" -Status "WARN" -Message "Bucket is publicly accessible"
            } else {
                Write-TestResult -TestName "Storage bucket '$bucketName'" -Status "PASS" -Message "Bucket is private"
            }
        }
    }
} else {
    Write-TestResult -TestName "Storage buckets" -Status "PASS" -Message "No storage buckets configured"
}

Write-Host ""

# Test 5: Check for sensitive extensions
Write-Host "[ Extension Security Tests ]" -ForegroundColor Yellow
$extQuery = @"
SELECT extname
FROM pg_extension
WHERE extname IN ('dblink', 'file_fdw', 'postgres_fdw', 'adminpack');
"@

$extResults = Invoke-SQLQuery -Query $extQuery
if ($extResults -and $extResults.Trim()) {
    $extensions = $extResults -split "`n" | Where-Object { $_ }
    foreach ($ext in $extensions) {
        Write-TestResult -TestName "Extension '$ext'" -Status "WARN" -Message "Potentially dangerous extension enabled"
    }
} else {
    Write-TestResult -TestName "Dangerous extensions" -Status "PASS" -Message "No dangerous extensions found"
}

Write-Host ""

# Test 6: Check for audit logging
Write-Host "[ Audit Configuration Tests ]" -ForegroundColor Yellow
$auditQuery = @"
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'audit_log' AND table_schema = 'public'
);
"@

$auditExists = Invoke-SQLQuery -Query $auditQuery
if ($auditExists -eq 't') {
    Write-TestResult -TestName "Audit logging" -Status "PASS" -Message "Audit log table exists"

    # Check if audit logging is active
    $auditCountQuery = "SELECT COUNT(*) FROM public.audit_log;"
    $auditCount = Invoke-SQLQuery -Query $auditCountQuery
    if ($auditCount -and [int]$auditCount -gt 0) {
        Write-TestResult -TestName "Audit activity" -Status "PASS" -Message "$auditCount audit entries found"
    } else {
        Write-TestResult -TestName "Audit activity" -Status "WARN" -Message "Audit table exists but no entries"
    }
} else {
    Write-TestResult -TestName "Audit logging" -Status "WARN" -Message "No audit logging configured"
}

Write-Host ""

# Generate summary
Write-Host "================================" -ForegroundColor Blue
Write-Host "📊 Test Summary" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "================================" -ForegroundColor Blue
Write-Host ""

$totalTests = $passedTests + $failedTests + $warnings
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "✅ Passed: $passedTests" -ForegroundColor Green
Write-Host "❌ Failed: $failedTests" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warnings" -ForegroundColor Yellow
Write-Host ""

# Calculate score
$score = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
$scoreColor = if ($score -ge 80) { "Green" } elseif ($score -ge 60) { "Yellow" } else { "Red" }
Write-Host "Security Score: $score%" -ForegroundColor $scoreColor

# Generate recommendations
if ($failedTests -gt 0 -or $warnings -gt 0) {
    Write-Host ""
    Write-Host "📝 Recommendations:" -ForegroundColor Cyan

    if ($tablesWithoutRLS.Count -gt 0) {
        Write-Host "  • Enable RLS on all tables using: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;" -ForegroundColor Yellow
    }

    if ($tablesWithoutPolicies.Count -gt 0) {
        Write-Host "  • Add policies to RLS-enabled tables to allow appropriate access" -ForegroundColor Yellow
    }

    if ($warnings -gt 0) {
        Write-Host "  • Review warnings and determine if they are acceptable for your use case" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Run .\Apply-SupabaseSecurity.ps1 to automatically fix these issues" -ForegroundColor Green
}

# Generate report if requested
if ($GenerateReport) {
    $reportPath = ".\SupabaseSecurityReport_$(Get-Date -Format 'yyyyMMdd_HHmmss').html"

    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Supabase Security Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .pass { color: green; }
        .fail { color: red; }
        .warn { color: orange; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        .summary { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .score { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Supabase Security Report</h1>
    <p>Generated: $(Get-Date)</p>

    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: $totalTests</p>
        <p class="pass">Passed: $passedTests</p>
        <p class="fail">Failed: $failedTests</p>
        <p class="warn">Warnings: $warnings</p>
        <p class="score">Security Score: $score%</p>
    </div>

    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Test Name</th>
            <th>Status</th>
            <th>Message</th>
            <th>Time</th>
        </tr>
"@

    foreach ($result in $testResults) {
        $statusClass = $result.Status.ToLower()
        $html += @"
        <tr>
            <td>$($result.TestName)</td>
            <td class="$statusClass">$($result.Status)</td>
            <td>$($result.Message)</td>
            <td>$($result.Timestamp.ToString('HH:mm:ss'))</td>
        </tr>
"@
    }

    $html += @"
    </table>
</body>
</html>
"@

    $html | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Host ""
    Write-Host "📄 Report generated: $reportPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Security test completed!" -ForegroundColor Green