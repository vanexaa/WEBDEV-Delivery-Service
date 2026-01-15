# Quick Test Script - UnifiedService (Port 5000)
# Tests all endpoints through the unified service

Write-Host "Testing UnifiedService (Port 5000)..." -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:5000"

try {
    # Test 1: Login
    Write-Host "1. Testing Login..." -ForegroundColor Cyan
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"password123"}'
    $token = $login.token
    Write-Host "   ✓ Login successful!" -ForegroundColor Green
    Write-Host "   User: $($login.user.username), Role: $($login.user.role)" -ForegroundColor White
    
    $headers = @{Authorization = "Bearer $token"}
    
    # Test 2: Get Orders
    Write-Host ""
    Write-Host "2. Testing Orders API..." -ForegroundColor Cyan
    try {
        $orders = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "   ✓ Orders API working! Found $($orders.Count) orders" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠ Orders API: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Test 3: Get Deliveries
    Write-Host ""
    Write-Host "3. Testing Deliveries API..." -ForegroundColor Cyan
    try {
        $deliveries = Invoke-RestMethod -Uri "$baseUrl/api/deliveries/active" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "   ✓ Deliveries API working! Found $($deliveries.Count) active deliveries" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠ Deliveries API: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Test 4: Get Riders
    Write-Host ""
    Write-Host "4. Testing Riders API..." -ForegroundColor Cyan
    try {
        $riders = Invoke-RestMethod -Uri "$baseUrl/api/riders" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "   ✓ Riders API working! Found $($riders.Count) riders" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠ Riders API: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Test 5: Get Customers (if order exists)
    Write-Host ""
    Write-Host "5. Testing Customers API..." -ForegroundColor Cyan
    try {
        $test = Invoke-RestMethod -Uri "$baseUrl/api/customers/1/rider" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "   ✓ Customers API working!" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠ Customers API: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "All tests completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "UnifiedService URLs:" -ForegroundColor Cyan
    Write-Host "  - Swagger: http://localhost:5000/swagger" -ForegroundColor White
    Write-Host "  - Auth: http://localhost:5000/api/auth/*" -ForegroundColor White
    Write-Host "  - Delivery: http://localhost:5000/api/deliveries/*" -ForegroundColor White
    Write-Host "  - Rider: http://localhost:5000/api/riders/*" -ForegroundColor White
    Write-Host "  - Order: http://localhost:5000/api/orders/*" -ForegroundColor White
    Write-Host "  - Customer: http://localhost:5000/api/customers/*" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "1. UnifiedService is running (cd Services\UnifiedService && dotnet run)" -ForegroundColor Yellow
    Write-Host "2. Backend is accessible at http://localhost:5000" -ForegroundColor Yellow
    Write-Host "3. Database is initialized" -ForegroundColor Yellow
}
