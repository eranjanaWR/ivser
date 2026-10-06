# API Test Script
$testResults = @()

# Test 1: With Fake JWT Token
Write-Host "Test 1: With Fake JWT Token"
Write-Host "============================"
$uri = 'http://localhost:5000/api/admin/advertising-requests'
$headers = @{'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZha2VVc2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'}
try {
    $response = Invoke-WebRequest -Uri $uri -Headers $headers -Method Get -ErrorAction Stop
    $test1Result = "200 OK - Valid Response"
    Write-Host "Status: 200 OK"
    Write-Host "Body: $($response.Content)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $test1Result = "$statusCode - $($_.Exception.Response.StatusDescription)"
    Write-Host "Status: $statusCode"
    Write-Host "Description: $($_.Exception.Response.StatusDescription)"
}
$testResults += $test1Result
Write-Host ""

# Test 2: Without Authorization Header
Write-Host "Test 2: Without Authorization Header"
Write-Host "====================================="
try {
    $response = Invoke-WebRequest -Uri $uri -Method Get -ErrorAction Stop
    $test2Result = "200 OK - Valid Response"
    Write-Host "Status: 200 OK"
    Write-Host "Body: $($response.Content)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $test2Result = "$statusCode - $($_.Exception.Response.StatusDescription)"
    Write-Host "Status: $statusCode"
    Write-Host "Description: $($_.Exception.Response.StatusDescription)"
}
$testResults += $test2Result
Write-Host ""

# Test 3: With Invalid Token Format
Write-Host "Test 3: With Invalid Token Format"
Write-Host "=================================="
$invalidHeaders = @{'Authorization' = 'Bearer invalid-token-format'}
try {
    $response = Invoke-WebRequest -Uri $uri -Headers $invalidHeaders -Method Get -ErrorAction Stop
    $test3Result = "200 OK - Valid Response"
    Write-Host "Status: 200 OK"
    Write-Host "Body: $($response.Content)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $test3Result = "$statusCode - $($_.Exception.Response.StatusDescription)"
    Write-Host "Status: $statusCode"
    Write-Host "Description: $($_.Exception.Response.StatusDescription)"
}
$testResults += $test3Result
Write-Host ""

# Summary
Write-Host "Test Summary"
Write-Host "============"
Write-Host "Test 1 (Fake JWT): $($testResults[0])"
Write-Host "Test 2 (No Auth): $($testResults[1])"
Write-Host "Test 3 (Invalid Format): $($testResults[2])"
