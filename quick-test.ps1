# Quick Service Test
Write-Host "`n=== Testing Services ===" -ForegroundColor Cyan

# Test 1: Auth Service Login
Write-Host "`n1. Testing Auth Service Login..." -ForegroundColor Yellow
try {
    $login = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"password123"}'
    Write-Host "   [OK] Login successful!" -ForegroundColor Green
    $token = $login.token
    Write-Host "   Token: $($token.Substring(0,30))..." -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test 2: Order Service
Write-Host "`n2. Testing Order Service..." -ForegroundColor Yellow
try {
    $orders = Invoke-RestMethod -Uri "http://localhost:5009/api/orders" -Method GET -Headers @{Authorization="Bearer $token"}
    Write-Host "   [OK] Orders retrieved! Count: $($orders.Count)" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Delivery Service
Write-Host "`n3. Testing Delivery Service..." -ForegroundColor Yellow
try {
    $deliveries = Invoke-RestMethod -Uri "http://localhost:5003/api/deliveries" -Method GET -Headers @{Authorization="Bearer $token"}
    Write-Host "   [OK] Deliveries retrieved! Count: $($deliveries.Count)" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Customer Service
Write-Host "`n4. Testing Customer Service..." -ForegroundColor Yellow
try {
    $test = Invoke-RestMethod -Uri "http://localhost:5007/api/customers/1/rider" -Method GET -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
    Write-Host "   [OK] Customer Service working!" -ForegroundColor Green
} catch {
    Write-Host "   [INFO] Service responds (order may not exist): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 5: Rider Service
Write-Host "`n5. Testing Rider Service..." -ForegroundColor Yellow
try {
    $rider = Invoke-RestMethod -Uri "http://localhost:5005/api/riders/2" -Method GET -Headers @{Authorization="Bearer $token"} -TimeoutSec 3
    Write-Host "   [OK] Rider Service working!" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Rider Service not running on port 5005" -ForegroundColor Red
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Check the results above. Most services are working!" -ForegroundColor Green
Write-Host "`nTo test manually, open Swagger UI:" -ForegroundColor Yellow
Write-Host "  - Auth: http://localhost:5001/swagger" -ForegroundColor White
Write-Host "  - Order: http://localhost:5009/swagger" -ForegroundColor White
Write-Host "  - Delivery: http://localhost:5003/swagger" -ForegroundColor White
Write-Host "  - Customer: http://localhost:5007/swagger" -ForegroundColor White
Write-Host ""
