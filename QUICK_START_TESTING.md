# Quick Start - Testing All Services

## 🚀 Fastest Way to Test Everything

### Step 1: Start All Backend Services

Open **5 separate PowerShell/Command Prompt windows** and run these commands:

**Window 1 - Auth Service:**
```powershell
cd "c:\Users\Paula\Desktop\Delivery Service - Microservices\Services\AuthService"
dotnet run
```
Wait until you see: `Now listening on: http://localhost:5001`

**Window 2 - Delivery Service:**
```powershell
cd "c:\Users\Paula\Desktop\Delivery Service - Microservices\Services\DeliveryService"
dotnet run
```
Wait until you see: `Now listening on: http://localhost:5003`

**Window 3 - Rider Service:**
```powershell
cd "c:\Users\Paula\Desktop\Delivery Service - Microservices\Services\RiderService"
dotnet run
```
Wait until you see: `Now listening on: http://localhost:5005`

**Window 4 - Customer Service:**
```powershell
cd "c:\Users\Paula\Desktop\Delivery Service - Microservices\Services\CustomerService"
dotnet run
```
Wait until you see: `Now listening on: http://localhost:5007`

**Window 5 - Order Service:**
```powershell
cd "c:\Users\Paula\Desktop\Delivery Service - Microservices\Services\OrderService"
dotnet run
```
Wait until you see: `Now listening on: http://localhost:5009`

---

### Step 2: Verify Services Are Running

Open these URLs in your browser to check Swagger UI:
- ✅ http://localhost:5001/swagger (Auth Service)
- ✅ http://localhost:5003/swagger (Delivery Service)
- ✅ http://localhost:5005/swagger (Rider Service)
- ✅ http://localhost:5007/swagger (Customer Service)
- ✅ http://localhost:5009/swagger (Order Service)

If you see Swagger UI, services are running! ✅

---

### Step 3: Run Automated Tests

Once all services are running, open a **new PowerShell window** and run:

```powershell
cd "c:\Users\Paula\Desktop\Delivery Service - Microservices"
.\test-services.ps1
```

This will automatically test all endpoints!

---

## 🧪 Manual Testing (Easiest Method)

### Using Swagger UI (Recommended)

1. **Open Swagger for Auth Service:**
   - Go to: http://localhost:5001/swagger
   - Find `POST /api/auth/login`
   - Click "Try it out"
   - Enter:
     ```json
     {
       "username": "admin",
       "password": "password123"
     }
     ```
   - Click "Execute"
   - **Copy the token** from the response

2. **Authorize in Swagger:**
   - Click the green "Authorize" button at the top
   - Paste your token (format: `Bearer <your_token>`)
   - Click "Authorize" then "Close"

3. **Test Other Endpoints:**
   - Now you can test any endpoint in Swagger
   - All requests will automatically include your token

---

## 📝 Test Accounts

Use these accounts to test different roles:

| Role | Username | Password | Use For |
|------|----------|----------|---------|
| **Admin** | `admin` | `password123` | Creating orders, assigning deliveries |
| **Rider** | `rider1` | `password123` | Updating delivery status, viewing orders |
| **Customer** | `customer1` | `password123` | Tracking orders, submitting feedback |

---

## 🔄 Complete Test Flow

### 1. Login as Admin
- URL: http://localhost:5001/swagger
- Endpoint: `POST /api/auth/login`
- Body: `{"username": "admin", "password": "password123"}`
- **Save the token!**

### 2. Create an Order
- URL: http://localhost:5009/swagger
- Endpoint: `POST /api/orders`
- Use the admin token from step 1
- Body:
  ```json
  {
    "customerId": 4,
    "customerName": "Test Customer",
    "customerPhone": "1234567890",
    "deliveryAddress": "123 Test Street",
    "orderTotal": 25.99,
    "paymentMethod": "COD"
  }
  ```
- **Save the orderId from response!**

### 3. Assign Delivery
- URL: http://localhost:5003/swagger
- Endpoint: `POST /api/deliveries/assign`
- Use admin token
- Body:
  ```json
  {
    "orderId": <orderId_from_step_2>,
    "riderId": 2
  }
  ```

### 4. Login as Rider
- URL: http://localhost:5001/swagger
- Endpoint: `POST /api/auth/login`
- Body: `{"username": "rider1", "password": "password123"}`
- **Save the rider token!**

### 5. Update Delivery Status
- URL: http://localhost:5003/swagger
- Endpoint: `PUT /api/deliveries/{deliveryId}/status`
- Use rider token
- Body: `{"status": "InTransit"}`

### 6. Complete Delivery
- Same endpoint as step 5
- Body: `{"status": "Delivered"}`

### 7. Login as Customer
- URL: http://localhost:5001/swagger
- Endpoint: `POST /api/auth/login`
- Body: `{"username": "customer1", "password": "password123"}`
- **Save the customer token!**

### 8. Submit Feedback
- URL: http://localhost:5007/swagger
- Endpoint: `POST /api/customers/{orderId}/feedback`
- Use customer token
- Body:
  ```json
  {
    "rating": 5,
    "comment": "Great service!"
  }
  ```

---

## 🎯 Quick Test Checklist

Test these in order:

- [ ] **Auth Service** - Login works (all 3 roles)
- [ ] **Order Service** - Create order works
- [ ] **Delivery Service** - Assign delivery works
- [ ] **Delivery Service** - Update status works
- [ ] **Rider Service** - Get rider profile works
- [ ] **Customer Service** - Get rider info works
- [ ] **Customer Service** - Submit feedback works

---

## 🆘 Troubleshooting

### "Cannot connect to service"
**Fix:** Make sure the service is running. Check the terminal window for that service.

### "401 Unauthorized"
**Fix:** 
- Get a fresh token by logging in again
- Make sure token format is: `Bearer <token>` (with space)

### "500 Internal Server Error"
**Fix:**
- Check the service terminal for error messages
- Make sure SQL Server is running
- Check database connection strings

### Service won't start
**Fix:**
- Make sure SQL Server is running
- Check if port is already in use
- Look at error messages in terminal

---

## 📚 More Help

- **Detailed Testing Guide:** See `TESTING_GUIDE.md`
- **API Documentation:** See `API_DOCUMENTATION.md`
- **Run Instructions:** See `RUN_INSTRUCTIONS.md`

---

**Need more help?** Check the service terminal windows for error messages, or look at the Swagger UI for endpoint details!
