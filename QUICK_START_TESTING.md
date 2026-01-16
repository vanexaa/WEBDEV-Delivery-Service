# Quick Start - Testing UnifiedService

## 🚀 Fastest Way to Test Everything

### Step 1: Start UnifiedService

Open a PowerShell/Command Prompt window and run:

```powershell
cd "c:\Users\Paula\Desktop\Delivery Service - Microservices\Services\UnifiedService"
dotnet run
```

Wait until you see: `Now listening on: http://localhost:5000`

---

### Step 2: Verify Service is Running

Open this URL in your browser to check Swagger UI:
- ✅ http://localhost:5000/swagger

If you see Swagger UI, UnifiedService is running! ✅

---

### Step 3: Run Automated Tests

Once UnifiedService is running, open a **new PowerShell window** and run:

```powershell
cd "c:\Users\Paula\Desktop\Delivery Service - Microservices"
.\quick-test.ps1
```

This will automatically test all endpoints!

---

## 🧪 Manual Testing (Easiest Method)

### Using Swagger UI (Recommended)

1. **Open Swagger:**
   - Go to: http://localhost:5000/swagger
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
- URL: http://localhost:5000/swagger
- Endpoint: `POST /api/auth/login`
- Body: `{"username": "admin", "password": "password123"}`
- **Save the token!**

### 2. Create an Order
- URL: http://localhost:5000/swagger
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
- URL: http://localhost:5000/swagger
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
- URL: http://localhost:5000/swagger
- Endpoint: `POST /api/auth/login`
- Body: `{"username": "rider1", "password": "password123"}`
- **Save the rider token!**

### 5. Update Delivery Status
- URL: http://localhost:5000/swagger
- Endpoint: `PUT /api/deliveries/{orderId}/status`
- Use rider token
- Body: `{"status": "InTransit"}`

### 6. Complete Delivery
- Same endpoint as step 5
- Body: `{"status": "Delivered"}`

### 7. Login as Customer
- URL: http://localhost:5000/swagger
- Endpoint: `POST /api/auth/login`
- Body: `{"username": "customer1", "password": "password123"}`
- **Save the customer token!**

### 8. Submit Feedback
- URL: http://localhost:5000/swagger
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

- [ ] **UnifiedService** - Service starts on port 5000
- [ ] **Auth API** - Login works (all 3 roles)
- [ ] **Order API** - Create order works
- [ ] **Delivery API** - Assign delivery works
- [ ] **Delivery API** - Update status works
- [ ] **Rider API** - Get rider profile works
- [ ] **Customer API** - Get rider info works
- [ ] **Customer API** - Submit feedback works

---

## 🆘 Troubleshooting

### "Cannot connect to service"
**Fix:** Make sure UnifiedService is running. Check the terminal window.

### "401 Unauthorized"
**Fix:** 
- Get a fresh token by logging in again
- Make sure token format is: `Bearer <token>` (with space)

### "500 Internal Server Error"
**Fix:**
- Check the service terminal for error messages
- Make sure SQL Server is running
- Check database connection strings in `appsettings.json`

### Service won't start
**Fix:**
- Make sure SQL Server is running
- Check if port 5000 is already in use
- Look at error messages in terminal

---

## 📚 More Help

- **Architecture:** See `ARCHITECTURE.md`
- **API Documentation:** See `API_DOCUMENTATION.md`
- **Run Instructions:** See `HOW_TO_RUN.md`
- **Login Instructions:** See `HOW_TO_RUN_LOGIN.md`

---

**Need more help?** Check the UnifiedService terminal window for error messages, or look at the Swagger UI for endpoint details!
