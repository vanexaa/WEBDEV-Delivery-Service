# Check Frontend Apps Status Script

Write-Host "`n=== Frontend Apps Status ===" -ForegroundColor Cyan
Write-Host ""

$apps = @(
    @{ Name = "Rider App"; Port = 3001 },
    @{ Name = "Customer App"; Port = 3002 },
    @{ Name = "Admin App"; Port = 3003 }
)

Write-Host "Checking if apps are running..." -ForegroundColor Yellow
Write-Host ""

foreach ($app in $apps) {
    # Check if port is listening
    $portListening = Get-NetTCPConnection -LocalPort $app.Port -State Listen -ErrorAction SilentlyContinue
    
    if ($portListening) {
        Write-Host "[PORT] $($app.Name) - Port $($app.Port) is listening" -ForegroundColor Green
        
        # Try to access the app via HTTP
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($app.Port)" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            Write-Host "  [HTTP] App is responding (Status: $($response.StatusCode))" -ForegroundColor Green
            Write-Host "  [URL]  http://localhost:$($app.Port)" -ForegroundColor Cyan
        } catch {
            Write-Host "  [HTTP] App is starting but not ready yet..." -ForegroundColor Yellow
            Write-Host "  [URL]  http://localhost:$($app.Port) (try opening in browser)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "[PORT] $($app.Name) - Port $($app.Port) is NOT listening" -ForegroundColor Red
        Write-Host "  [STATUS] App is not running" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "=== Node Processes ===" -ForegroundColor Cyan
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node"} | Select-Object Id, @{Name='CPU';Expression={$_.CPU}}, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet64/1MB,2)}} | Format-Table -AutoSize
Write-Host $nodeProcesses

Write-Host "`n=== How to Access ===" -ForegroundColor Cyan
Write-Host "1. Open your browser and go to the app URLs listed above" -ForegroundColor White
Write-Host "2. If apps are not responding, check the PowerShell windows that opened" -ForegroundColor White
Write-Host "3. Look for windows with 'npm run dev' in the title" -ForegroundColor White
Write-Host "4. If you see errors, the apps may need dependencies installed" -ForegroundColor White
Write-Host ""
