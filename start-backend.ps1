# Start UnifiedService - Single Backend Service
# All services are now consolidated in UnifiedService running on port 5000

Write-Host "Starting UnifiedService..." -ForegroundColor Green
Write-Host ""
Write-Host "UnifiedService consolidates all microservices (Auth, Delivery, Rider, Order, Customer)" -ForegroundColor Cyan
Write-Host "into a single backend application running on port 5000." -ForegroundColor Cyan
Write-Host ""

$basePath = Get-Location
$unifiedServicePath = Join-Path $basePath "Services\UnifiedService"

Write-Host "Starting UnifiedService on port 5000..." -ForegroundColor Yellow
Write-Host ""

# Start UnifiedService
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$unifiedServicePath'; dotnet run"

Write-Host ""
Write-Host "UnifiedService is starting!" -ForegroundColor Green
Write-Host "Check the PowerShell window for service status." -ForegroundColor Yellow
Write-Host ""
Write-Host "Service URL:" -ForegroundColor Cyan
Write-Host "  UnifiedService: http://localhost:5000/swagger" -ForegroundColor White
Write-Host ""
Write-Host "All API endpoints:" -ForegroundColor Cyan
Write-Host "  - Auth: http://localhost:5000/api/auth/*" -ForegroundColor White
Write-Host "  - Delivery: http://localhost:5000/api/deliveries/*" -ForegroundColor White
Write-Host "  - Rider: http://localhost:5000/api/riders/*" -ForegroundColor White
Write-Host "  - Order: http://localhost:5000/api/orders/*" -ForegroundColor White
Write-Host "  - Customer: http://localhost:5000/api/customers/*" -ForegroundColor White
Write-Host ""
