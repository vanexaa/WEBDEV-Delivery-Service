# Start Frontend Applications Script
# Run each app using npm run dev

Write-Host "Starting Frontend Applications..." -ForegroundColor Green
Write-Host ""

$basePath = Get-Location
$frontendPath = Join-Path $basePath "Frontend"

$apps = @(
    @{ Name = "Auth App (Login)"; Path = "auth-app"; Port = 3000 },
    @{ Name = "Rider App"; Path = "rider-app"; Port = 3001 },
    @{ Name = "Customer App"; Path = "customer-app"; Port = 3002 },
    @{ Name = "Admin App"; Path = "admin-app"; Port = 3003 }
)

Write-Host "Note: Each app will run in a new window using 'npm run dev'." -ForegroundColor Yellow
Write-Host "Close the windows to stop the apps." -ForegroundColor Yellow
Write-Host ""

foreach ($app in $apps) {
    $appPath = Join-Path $frontendPath $app.Path
    Write-Host "Starting $($app.Name) on port $($app.Port)..." -ForegroundColor Cyan
    
    # Check if node_modules exists, if not install dependencies
    $nodeModulesPath = Join-Path $appPath "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Host "  Installing dependencies for $($app.Name)..." -ForegroundColor Yellow
        Set-Location $appPath
        npm install
        Set-Location $basePath
    }
    
    # Start the app in a new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$appPath'; Write-Host 'Starting $($app.Name) on port $($app.Port)...' -ForegroundColor Green; npm run dev"
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "Waiting for apps to compile and start (this may take 30-60 seconds)..." -ForegroundColor Yellow
Write-Host ""

# Wait and test if apps are accessible
$maxWait = 90
$waitInterval = 5
$elapsed = 0

while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds $waitInterval
    $elapsed += $waitInterval
    
    $allRunning = $true
    foreach ($app in $apps) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($app.Port)" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            Write-Host "[OK] $($app.Name) is running on http://localhost:$($app.Port)" -ForegroundColor Green
        } catch {
            $allRunning = $false
        }
    }
    
    if ($allRunning) {
        Write-Host ""
        Write-Host "All apps are running!" -ForegroundColor Green
        break
    } else {
        Write-Host "Still waiting... ($elapsed seconds)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "App URLs:" -ForegroundColor Cyan
foreach ($app in $apps) {
    Write-Host "  $($app.Name): http://localhost:$($app.Port)" -ForegroundColor White
}
Write-Host ""
Write-Host "Check the PowerShell windows for any errors or compilation messages." -ForegroundColor Yellow
Write-Host ""
