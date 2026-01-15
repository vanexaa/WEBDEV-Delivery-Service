# How to Run the Application - Complete Guide

## 🚀 Quick Start

### Step 1: Start All Backend Services

**Easiest way - Use the start script:**
```powershell
cd "c:\Users\Paula\Desktop\Delivery Service - Microservices"
.\start-backend.ps1
```

This will open 5 separate windows, one for each service. Wait until you see "Now listening on: http://localhost:XXXX" in each window.

**Or manually start each service:**
Open 5 separate PowerShell windows:

```powershell
# Window 1 - Auth Service
cd "Services\AuthService"
dotnet run

# Window 2 - Delivery Service  
cd "Services\DeliveryService"
dotnet run

# Window 3 - Rider Service
cd "Services\RiderService"
dotnet run

# Window 4 - Customer Service
cd "Services\CustomerService"
dotnet run

# Window 5 - Order Service
cd "Services\OrderService"
dotnet run
```

---

### Step 2: Start Frontend Applications

Open 3 separate PowerShell windows:

```powershell
# Window 1 - Rider App
cd "Frontend\rider-app"
npm run dev


# Window 3 - Admin App
cd "Frontend\admin-app"
npm run dev
```

---

## 🔐 Login Credentials

**Yes, there is a login system!** Use these credentials:

| Role | Username | Password | App URL |
|------|----------|----------|---------|
| **Admin** | `admin` | `password123` | http://localhost:3001 (Admin App) |
| **Rider** | `rider1` | `password123` | http://localhost:3001 (Rider App) |
| **Customer** | `customer1` | `password123` | http://localhost:3002 (Customer App) |

**Additional test accounts:**
- `rider2` / `password123` (Rider)
- `customer2` / `password123` (Customer)

---

## 🌐 Access the Applications

### Frontend Apps (With Login):

1. **Rider App** - http://localhost:3001
   - Login with: `rider1` / `password123`
   - View and manage deliveries
   - Update delivery status
   - View earnings

2. **Customer App** - http://localhost:3002
   - Login with: `customer1` / `password123`
   - Track orders
   - View delivery status
   - Submit feedback

3. **Admin App** - http://localhost:3001 (different port if rider-app is running)
   - Login with: `admin` / `password123`
   - View all deliveries
   - Assign deliveries to riders
   - View statistics

### Backend APIs (Swagger UI - No login needed for testing):

- **Auth Service:** http://localhost:5001/swagger
- **Delivery Service:** http://localhost:5003/swagger
- **Rider Service:** http://localhost:5005/swagger
- **Customer Service:** http://localhost:5007/swagger
- **Order Service:** http://localhost:5009/swagger

---

## 📝 Step-by-Step: How to Login

### Option 1: Using Frontend Apps

1. **Start all services** (backend + frontend)
2. **Open browser** and go to:
   - Rider App: http://localhost:3001
   - Customer App: http://localhost:3002
   - Admin App: http://localhost:3001 (or different port)
3. **Enter credentials:**
   - Username: `admin` (or `rider1`, `customer1`)
   - Password: `password123`
4. **Click "Login"**
5. You'll be redirected to the dashboard!

### Option 2: Using Swagger UI (API Testing)

1. **Open Swagger:** http://localhost:5001/swagger
2. **Find** `POST /api/auth/login`
3. **Click "Try it out"**
4. **Enter:**
   ```json
   {
     "username": "admin",
     "password": "password123"
   }
   ```
5. **Click "Execute"**
6. **Copy the token** from the response
7. **Click "Authorize"** button (green lock icon)
8. **Enter:** `Bearer <your_token>`
9. **Click "Authorize"** then "Close"
10. Now you can test all endpoints!

---

## ✅ Verify Everything is Running

### Check Backend Services:
Open these URLs - you should see Swagger UI:
- ✅ http://localhost:5001/swagger
- ✅ http://localhost:5003/swagger
- ✅ http://localhost:5005/swagger
- ✅ http://localhost:5007/swagger
- ✅ http://localhost:5009/swagger

### Check Frontend Apps:
Open these URLs - you should see login pages:
- ✅ http://localhost:3001 (Rider/Admin App)
- ✅ http://localhost:3002 (Customer App)

### Quick Test:
Run this command to test if services are working:
```powershell
.\quick-test.ps1
```

---

## 🎯 Complete Workflow Example

### 1. Start Everything
```powershell
# Start backend services
.\start-backend.ps1

# Wait 30-60 seconds for services to start

# Start frontend apps (in separate windows)
cd Frontend\rider-app
npm run dev

cd Frontend\customer-app  
npm run dev

cd Frontend\admin-app
npm run dev
```

### 2. Login as Admin
- Go to: http://localhost:3001 (Admin App)
- Username: `admin`
- Password: `password123`
- You'll see the admin dashboard

### 3. Create an Order (via Swagger or Admin App)
- Use Swagger: http://localhost:5009/swagger
- Or use the Admin App interface

### 4. Login as Rider
- Go to: http://localhost:3001 (Rider App)
- Username: `rider1`
- Password: `password123`
- View assigned orders

### 5. Login as Customer
- Go to: http://localhost:3002 (Customer App)
- Username: `customer1`
- Password: `password123`
- Track your order

---

## 🆘 Troubleshooting

### "Cannot connect" or "Service not running"
**Fix:** Make sure all backend services are started. Check the terminal windows.

### "Login failed" or "Invalid credentials"
**Fix:** 
- Make sure you're using: `admin` / `password123`
- Check if the database has test accounts (they're created automatically)
- Try logging in via Swagger first to test

### "Port already in use"
**Fix:** 
- Another service is using that port
- Close the other service or change the port in `appsettings.json`

### Frontend app won't start
**Fix:**
- Make sure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check for errors in the terminal

---

## 📋 Quick Reference

**Backend Services:**
- Auth: http://localhost:5001
- Delivery: http://localhost:5003
- Rider: http://localhost:5005
- Customer: http://localhost:5007
- Order: http://localhost:5009

**Frontend Apps:**
- Rider App: http://localhost:3001
- Customer App: http://localhost:3002
- Admin App: http://localhost:3001 (or different port)

**Login:**
- Username: `admin`, `rider1`, or `customer1`
- Password: `password123`

---

**That's it! You're ready to use the application! 🎉**
