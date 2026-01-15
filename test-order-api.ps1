# Test Order API - UnifiedService (Port 5000)

Write-Host "Testing Order API through UnifiedService..." -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:5000"

try {
    # Login first
    Write-Host "1. Logging in..." -ForegroundColor Cyan
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"password123"}'
    $token = $loginResponse.token
    Write-Host "   ✓ Login successful!" -ForegroundColor Green
    
    $headers = @{Authorization = "Bearer $token"}
    
    # Test Order endpoints
    Write-Host ""
    Write-Host "2. Testing Order endpoints..." -ForegroundColor Cyan
    
    # Get all orders
    Write-Host "   - Getting all orders..." -ForegroundColor White
    $orders = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method GET -Headers $headers
    Write-Host "   ✓ Found $($orders.Count) orders" -ForegroundColor Green
    
    if ($orders.Count -gt 0) {
        $firstOrder = $orders[0]
        $orderId = $firstOrder.orderId
        Write-Host ""
        Write-Host "   - Getting order by ID: $orderId..." -ForegroundColor White
        $order = Invoke-RestMethod -Uri "$baseUrl/api/orders/$orderId" -Method GET -Headers $headers
        Write-Host "   ✓ Order retrieved successfully!" -ForegroundColor Green
        Write-Host "     Order ID: $($order.orderId), Status: $($order.status)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "All tests passed! ✓" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure UnifiedService is running on http://localhost:5000" -ForegroundColor Yellow
}
