# Start Unified Frontend Application
# Runs the unified frontend app on port 3000

Write-Host "Starting Unified Frontend Application..." -ForegroundColor Green
Write-Host ""
Write-Host "Unified Frontend App runs on a single port (3000)" -ForegroundColor Cyan
Write-Host "All roles (Admin, Rider, Customer) accessible through one app" -ForegroundColor Cyan
Write-Host ""

$basePath = Get-Location
$unifiedAppPath = Join-Path $basePath "Frontend\unified-app"

# Check if node_modules exists
$nodeModulesPath = Join-Path $unifiedAppPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Set-Location $unifiedAppPath
    npm install
    Write-Host ""
}

# Start unified app
Write-Host "Starting unified frontend app on port 3000..." -ForegroundColor Yellow
Set-Location $unifiedAppPath
npm run dev

Write-Host ""
Write-Host "Unified Frontend App is starting!" -ForegroundColor Green
Write-Host "Access the app at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "After login, you'll be redirected based on your role:" -ForegroundColor White
Write-Host "  - Admin → /admin/dashboard" -ForegroundColor White
Write-Host "  - Rider → /rider/dashboard" -ForegroundColor White
Write-Host "  - Customer → /customer/track" -ForegroundColor White
Write-Host ""
