# Start Frontend Applications Script
# Run each app using npm run dev

Write-Host "Starting Frontend Applications..." -ForegroundColor Green
Write-Host ""

$basePath = Get-Location
$frontendPath = Join-Path $basePath "Frontend"

$apps = @(
    @{ Name = "Unified App"; Path = "unified-app"; Port = 3000 },
    @{ Name = "Rider App"; Path = "rider-app"; Port = 3001 },
    @{ Name = "Customer App"; Path = "customer-app"; Port = 3002 }
)

Write-Host "Note: Each app will run in a new window using 'npm run dev'." -ForegroundColor Yellow
Write-Host "Close the windows to stop the apps." -ForegroundColor Yellow
Write-Host ""

foreach ($app in $apps) {
    Write-Host "Starting $($app.Name) on port $($app.Port)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath\$($app.Path)'; npm run dev"
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "All frontend apps are starting!" -ForegroundColor Green
Write-Host "Check the new PowerShell windows and browser for apps." -ForegroundColor Yellow
Write-Host ""
Write-Host "App URLs:" -ForegroundColor Cyan
foreach ($app in $apps) {
    Write-Host "  $($app.Name): http://localhost:$($app.Port)" -ForegroundColor White
}
Write-Host ""
