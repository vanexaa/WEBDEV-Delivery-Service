# Test API Fetching - UnifiedService (Port 5000)
# Tests all GET endpoints through the unified service

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing API Fetching - UnifiedService" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"

Write-Host "Testing Order Service..." -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Gray

# Test 1: Get All Orders
Write-Host "`n1. GET /api/orders - Get All Orders" -ForegroundColor Cyan
try {
    $orders = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method GET
    Write-Host "   ✓ Success! Found $($orders.Count) orders" -ForegroundColor Green
    if ($orders.Count -gt 0) {
        Write-Host "   First order ID: $($orders[0].orderId)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get Order by ID
Write-Host "`n2. GET /api/orders/{id} - Get Order by ID" -ForegroundColor Cyan
try {
    $orderId = 1
    $order = Invoke-RestMethod -Uri "$baseUrl/api/orders/$orderId" -Method GET
    Write-Host "   ✓ Success! Order ID: $($order.orderId)" -ForegroundColor Green
    Write-Host "   Status: $($order.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠ Order may not exist: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 3: Get Orders by Customer ID
Write-Host "`n3. GET /api/orders/customer/{customerId} - Get Orders by Customer ID" -ForegroundColor Cyan
try {
    $customerId = 1
    $orders = Invoke-RestMethod -Uri "$baseUrl/api/orders/customer/$customerId" -Method GET
    Write-Host "   ✓ Success! Found $($orders.Count) orders for customer $customerId" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing Delivery Service..." -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Gray

# Test 4: Get Active Deliveries
Write-Host "`n4. GET /api/deliveries/active - Get Active Deliveries" -ForegroundColor Cyan
try {
    $deliveries = Invoke-RestMethod -Uri "$baseUrl/api/deliveries/active" -Method GET
    Write-Host "   ✓ Success! Found $($deliveries.Count) active deliveries" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get Delivery by Order ID
Write-Host "`n5. GET /api/deliveries/{orderId} - Get Delivery by Order ID" -ForegroundColor Cyan
try {
    $orderId = 1
    $delivery = Invoke-RestMethod -Uri "$baseUrl/api/deliveries/$orderId" -Method GET
    Write-Host "   ✓ Success! Delivery found for order $orderId" -ForegroundColor Green
    Write-Host "   Status: $($delivery.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠ Delivery may not exist: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing Rider Service..." -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Gray

# Test 6: Get All Riders
Write-Host "`n6. GET /api/riders - Get All Riders" -ForegroundColor Cyan
try {
    $riders = Invoke-RestMethod -Uri "$baseUrl/api/riders" -Method GET
    Write-Host "   ✓ Success! Found $($riders.Count) riders" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Get Rider by ID
Write-Host "`n7. GET /api/riders/{riderId} - Get Rider by ID" -ForegroundColor Cyan
try {
    $riderId = 1
    $rider = Invoke-RestMethod -Uri "$baseUrl/api/riders/$riderId" -Method GET
    Write-Host "   ✓ Success! Rider found: $($rider.fullName)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Rider may not exist: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing Customer Service..." -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Gray

# Test 8: Get Rider Info for Order
Write-Host "`n8. GET /api/customers/{orderId}/rider - Get Rider Info" -ForegroundColor Cyan
try {
    $orderId = 1
    $riderInfo = Invoke-RestMethod -Uri "$baseUrl/api/customers/$orderId/rider" -Method GET
    Write-Host "   ✓ Success! Rider info retrieved" -ForegroundColor Green
    Write-Host "   Rider: $($riderInfo.fullName)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠ Rider info may not be available: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 9: Get ETA
Write-Host "`n9. GET /api/customers/{orderId}/eta - Get ETA" -ForegroundColor Cyan
try {
    $orderId = 1
    $eta = Invoke-RestMethod -Uri "$baseUrl/api/customers/$orderId/eta" -Method GET
    Write-Host "   ✓ Success! ETA retrieved" -ForegroundColor Green
    if ($eta.estimatedTime) {
        Write-Host "   Estimated time: $($eta.estimatedTime) minutes" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠ ETA may not be available: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All tests completed through UnifiedService (Port 5000)" -ForegroundColor Green
Write-Host ""
Write-Host "UnifiedService URLs:" -ForegroundColor Cyan
Write-Host "  - Swagger: http://localhost:5000/swagger" -ForegroundColor White
Write-Host "  - Auth: http://localhost:5000/api/auth/*" -ForegroundColor White
Write-Host "  - Delivery: http://localhost:5000/api/deliveries/*" -ForegroundColor White
Write-Host "  - Rider: http://localhost:5000/api/riders/*" -ForegroundColor White
Write-Host "  - Order: http://localhost:5000/api/orders/*" -ForegroundColor White
Write-Host "  - Customer: http://localhost:5000/api/customers/*" -ForegroundColor White
Write-Host ""
