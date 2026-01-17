# Quick test script to verify login endpoint
Write-Host 'Testing Login Endpoint...' -ForegroundColor Green
Write-Host ''

$url = 'http://localhost:5000/api/auth/login'
$body = @{
    username = 'admin'
    password = 'password123'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType 'application/json'
    Write-Host 'Login successful!' -ForegroundColor Green
    Write-Host ("User: {0}" -f $response.user.username) -ForegroundColor Cyan
    Write-Host ("Role: {0}" -f $response.user.role) -ForegroundColor Cyan
    Write-Host ("Email: {0}" -f $response.user.email) -ForegroundColor Cyan
} catch {
    Write-Host 'Login failed!' -ForegroundColor Red
    Write-Host ("Error: {0}" -f $_.Exception.Message) -ForegroundColor Red
    Write-Host ''
    Write-Host 'Make sure:' -ForegroundColor Yellow
    Write-Host '1. UnifiedService is running (cd Services\UnifiedService; dotnet run)' -ForegroundColor Yellow
    Write-Host '2. Backend is accessible at http://localhost:5000' -ForegroundColor Yellow
    Write-Host '3. Database is initialized' -ForegroundColor Yellow
}
