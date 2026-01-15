# Start Backend Services Script
# Run each service using dotnet run

Write-Host "Starting Backend Services..." -ForegroundColor Green
Write-Host ""

$basePath = Get-Location
$servicesPath = Join-Path $basePath "Services"

$services = @(
    @{ Name = "AuthService"; Path = "AuthService/AuthService.csproj"; Port = 5001 },
    @{ Name = "DeliveryService"; Path = "DeliveryService/DeliveryService.csproj"; Port = 5003 },
    @{ Name = "RiderService"; Path = "RiderService/RiderService.csproj"; Port = 5005 },
    @{ Name = "CustomerService"; Path = "CustomerService/CustomerService.csproj"; Port = 5007 },
    @{ Name = "OrderService"; Path = "OrderService/OrderService.csproj"; Port = 5009 }
)

Write-Host "Note: Each service will run in a new window using 'dotnet run'." -ForegroundColor Yellow
Write-Host "Close the windows to stop the services." -ForegroundColor Yellow
Write-Host ""

foreach ($service in $services) {
    Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$servicesPath'; dotnet run --project $($service.Path)"
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "All backend services are starting!" -ForegroundColor Green
Write-Host "Check the new PowerShell windows for service status." -ForegroundColor Yellow
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
foreach ($service in $services) {
    Write-Host "  $($service.Name): http://localhost:$($service.Port)/swagger" -ForegroundColor White
}
Write-Host ""
