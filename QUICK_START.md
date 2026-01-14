# 🚀 Quick Start Guide

## Prerequisites
- **.NET SDK 8.0** (for backend services)
- **Node.js** (for frontend apps)
- **PowerShell** (Windows)

---

## Step 1: Start Backend Services

Open **5 separate PowerShell windows** and run:

```powershell
# Window 1 - Auth Service (Port 5001)
cd "WEBDEV-Delivery-Service\Services\AuthService"
dotnet run

# Window 2 - Delivery Service (Port 5003)
cd "WEBDEV-Delivery-Service\Services\DeliveryService"
dotnet run

# Window 3 - Rider Service (Port 5005)
cd "WEBDEV-Delivery-Service\Services\RiderService"
dotnet run

# Window 4 - Customer Service (Port 5007)
cd "WEBDEV-Delivery-Service\Services\CustomerService"
dotnet run

# Window 5 - Order Service (Port 5009)
cd "WEBDEV-Delivery-Service\Services\OrderService"
dotnet run
```

**Wait until you see:** `Now listening on: http://localhost:XXXX` in each window.

---

## Step 2: Install Frontend Dependencies (First Time Only)

Open **3 PowerShell windows**:

```powershell
# Window 1 - Admin App
cd "WEBDEV-Delivery-Service\Frontend\admin-app"
npm install

# Window 2 - Rider App
cd "WEBDEV-Delivery-Service\Frontend\rider-app"
npm install

# Window 3 - Customer App (if exists)
cd "WEBDEV-Delivery-Service\Frontend\customer-app"
npm install
```

---

## Step 3: Start Frontend Applications

After installing dependencies, start the apps:

```powershell
# Window 1 - Admin App (Port 3003)
cd "WEBDEV-Delivery-Service\Frontend\admin-app"
npm run dev

# Window 2 - Rider App (Port 3001)
cd "WEBDEV-Delivery-Service\Frontend\rider-app"
npm run dev

# Window 3 - Customer App (Port 3002) - if exists
cd "WEBDEV-Delivery-Service\Frontend\customer-app"
npm run dev
```

---

## 🌐 Access the Applications

### Frontend Apps:
- **Admin App:** http://localhost:3003
- **Rider App:** http://localhost:3001
- **Customer App:** http://localhost:3002 (if exists)

### Backend APIs (Swagger):
- **Auth Service:** http://localhost:5001/swagger
- **Delivery Service:** http://localhost:5003/swagger
- **Rider Service:** http://localhost:5005/swagger
- **Customer Service:** http://localhost:5007/swagger
- **Order Service:** http://localhost:5009/swagger

---

## 🔐 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `password123` |
| **Rider** | `rider1` | `password123` |
| **Customer** | `customer1` | `password123` |

---

## ✅ Verify Everything is Running

1. **Backend Services:** Open Swagger URLs above - you should see API documentation
2. **Frontend Apps:** Open the app URLs - you should see login pages
3. **Test Login:** Use credentials above to login

---

## 🆘 Troubleshooting

### "Port already in use"
- Close the application using that port
- Or change the port in the service's configuration

### "Cannot connect to backend"
- Make sure all 5 backend services are running
- Check if services are listening on correct ports

### "npm command not found"
- Install Node.js from https://nodejs.org/
- Restart PowerShell after installation

### "dotnet command not found"
- Install .NET SDK 8.0 from https://dotnet.microsoft.com/download
- Restart PowerShell after installation

---

**That's it! You're ready to use the application! 🎉**

