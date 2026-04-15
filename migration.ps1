$body = @{
  email = "admin1@smartautohub.com"
  password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body $body -UseBasicParsing
$token = ($response.Content | ConvertFrom-Json).data.token

Write-Host "✓ Login successful!"

# Call migration endpoint
$migrationResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/migrate-vehicle-status" -Method Post -Headers @{Authorization = "Bearer $token"} -ContentType "application/json" -UseBasicParsing
$result = $migrationResponse.Content | ConvertFrom-Json

Write-Host "`n✓ Migration Complete:"
Write-Host "  Modified: $($result.migrationResult.modified) vehicles"
Write-Host "  Active: $($result.vehiclesByStatus.active)"
Write-Host "  Total: $($result.vehiclesByStatus.total)"
