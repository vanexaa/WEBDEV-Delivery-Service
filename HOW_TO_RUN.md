# How to Run the Application - UnifiedService

## 🚀 Quick Start

### Step 1: Start UnifiedService Backend

**Single command to start everything:**

```powershell
cd "Services\UnifiedService"
dotnet run
```

**Or use the start script:**
```powershell
.\start-backend.ps1
```

The UnifiedService will start on **http://localhost:5000**

Wait until you see: `Now listening on: http://localhost:5000`

---

### Step 2: Start Frontend Applications

Open separate PowerShell windows:

```powershell
# Window 1 - Rider App
cd "Frontend\rider-app"
npm run dev

# Window 2 - Customer App
cd "Frontend\customer-app"
npm run dev

# Window 3 - Admin App
cd "Frontend\admin-app"
npm run dev
```

**Or use the start script:**
```powershell
.\start-frontend.ps1
```

---

## 🔐 Login Credentials

Use these credentials to login:

| Role | Username | Password | App URL |
|------|----------|----------|---------|
| **Admin** | `admin` | `password123` | http://localhost:3003 (Admin App) |
| **Rider** | `rider1` | `password123` | http://localhost:3001 (Rider App) |
| **Customer** | `customer1` | `password123` | http://localhost:3002 (Customer App) |

**Additional test accounts:**
- `rider2` / `password123` (Rider)
- `customer2` / `password123` (Customer)

---

## 🌐 Access the Applications

### Frontend Apps:

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

3. **Admin App** - http://localhost:3003
   - Login with: `admin` / `password123`
   - View all deliveries
   - Assign deliveries to riders
   - View statistics

4. **Login Page** - `Frontend/login-test.html`
   - Open in browser or use HTTP server
   - Redirects to appropriate app based on role

### Backend API (Swagger UI):

- **UnifiedService:** http://localhost:5000/swagger
  - All APIs accessible through single port
  - Auth: `/api/auth/*`
  - Delivery: `/api/deliveries/*`
  - Rider: `/api/riders/*`
  - Order: `/api/orders/*`
  - Customer: `/api/customers/*`

---

## 📝 Step-by-Step: How to Login

### Option 1: Using Login Page (Recommended)

1. **Start UnifiedService:**
   ```powershell
   cd Services\UnifiedService
   dotnet run
   ```

2. **Open login page:**
   - Navigate to: `Frontend\login-test.html`
   - Right-click → Open with browser
   - Or use: `cd Frontend && python -m http.server 8080`
   - Then open: `http://localhost:8080/login-test.html`

3. **Enter credentials:**
   - Username: `admin` (or `rider1`, `customer1`)
   - Password: `password123`

4. **Click "Login"**
5. You'll be redirected to the appropriate app!

### Option 2: Using Swagger UI (API Testing)

1. **Open Swagger:** http://localhost:5000/swagger
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

### Check Backend Service:
Open this URL - you should see Swagger UI:
- ✅ http://localhost:5000/swagger

### Check Frontend Apps:
Open these URLs - you should see login pages or dashboards:
- ✅ http://localhost:3001 (Rider App)
- ✅ http://localhost:3002 (Customer App)
- ✅ http://localhost:3003 (Admin App)

### Quick Test:
Run this command to test if UnifiedService is working:
```powershell
.\quick-test.ps1
```

---

## 🎯 Complete Workflow Example

### 1. Start Everything
```powershell
# Start UnifiedService
cd Services\UnifiedService
dotnet run

# Wait 5-10 seconds for service to start

# Start frontend apps (in separate windows)
cd Frontend\rider-app
npm run dev

cd Frontend\customer-app  
npm run dev

cd Frontend\admin-app
npm run dev
```

### 2. Login as Admin
- Go to: http://localhost:3003 (Admin App) or use login-test.html
- Username: `admin`
- Password: `password123`
- You'll see the admin dashboard

### 3. Create an Order (via Swagger or Admin App)
- Use Swagger: http://localhost:5000/swagger
- Endpoint: `POST /api/orders`
- Or use the Admin App interface

### 4. Login as Rider
- Go to: http://localhost:3001 (Rider App) or use login-test.html
- Username: `rider1`
- Password: `password123`
- View assigned orders

### 5. Login as Customer
- Go to: http://localhost:3002 (Customer App) or use login-test.html
- Username: `customer1`
- Password: `password123`
- Track your order

---

## 🆘 Troubleshooting

### "Cannot connect" or "Service not running"
**Fix:** Make sure UnifiedService is started. Check the terminal window.

### "Login failed" or "Invalid credentials"
**Fix:** 
- Make sure you're using: `admin` / `password123`
- Check if the database has test accounts (they're created automatically)
- Try logging in via Swagger first to test

### "Port already in use"
**Fix:** 
- Another service is using port 5000
- Close the other service or change the port in `Services/UnifiedService/Properties/launchSettings.json`

### Frontend app won't start
**Fix:**
- Make sure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check for errors in the terminal

---

## 📋 Quick Reference

**Backend Service:**
- UnifiedService: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger

**Frontend Apps:**
- Rider App: http://localhost:3001
- Customer App: http://localhost:3002
- Admin App: http://localhost:3003

**Login:**
- Username: `admin`, `rider1`, or `customer1`
- Password: `password123`

---

**That's it! You're ready to use the application! 🎉**
