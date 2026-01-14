# How to Run the Application

## Running Backend Services

Open separate terminal/command prompt windows and use `dotnet run` for each service:

### Terminal 1 - Auth Service
```bash
cd Services/AuthService
dotnet run
```
Service will run on: http://localhost:5001

### Terminal 2 - Delivery Service
```bash
cd Services/DeliveryService
dotnet run
```
Service will run on: http://localhost:5003

### Terminal 3 - Rider Service
```bash
cd Services/RiderService
dotnet run
```
Service will run on: http://localhost:5005

### Terminal 4 - Customer Service
```bash
cd Services/CustomerService
dotnet run
```
Service will run on: http://localhost:5007

### Terminal 5 - Order Service
```bash
cd Services/OrderService
dotnet run
```
Service will run on: http://localhost:5009

## Running Frontend Applications

Open separate terminal/command prompt windows:

### Terminal 1 - Unified App (Main Login)
```bash
cd Frontend/unified-app
npm run dev
```
App will run on: http://localhost:3000

### Terminal 2 - Rider App
```bash
cd Frontend/rider-app
npm run dev
```
App will run on: http://localhost:3001

### Terminal 3 - Customer App
```bash
cd Frontend/customer-app
npm run dev
```
App will run on: http://localhost:3002

### Terminal 4 - Admin App (Optional)
```bash
cd Frontend/admin-app
npm run dev
```
App will run on: http://localhost:3001 (start separately if rider-app is running)

## Quick Start Steps

1. **Start all backend services** (open 5 terminal windows):
   ```bash
   # Terminal 1
   cd Services/AuthService && dotnet run
   
   # Terminal 2
   cd Services/DeliveryService && dotnet run
   
   # Terminal 3
   cd Services/RiderService && dotnet run
   
   # Terminal 4
   cd Services/CustomerService && dotnet run
   
   # Terminal 5
   cd Services/OrderService && dotnet run
   ```
   - Each service will automatically create its database when it starts
   - Wait for each service to show "Now listening on: http://localhost:XXXX"

2. **Start frontend applications** (open 3-4 terminal windows):
   ```bash
   # Terminal 1 - Unified App (main login)
   cd Frontend/unified-app && npm run dev
   
   # Terminal 2 - Rider App
   cd Frontend/rider-app && npm run dev
   
   # Terminal 3 - Customer App
   cd Frontend/customer-app && npm run dev
   ```

3. **Access the application**:
   - Main login: http://localhost:3000
   - Backend APIs: http://localhost:5001/swagger (and other ports)

## Service URLs

### Backend Services (Swagger UI):
- Auth Service: http://localhost:5001/swagger
- Delivery Service: http://localhost:5003/swagger
- Rider Service: http://localhost:5005/swagger
- Customer Service: http://localhost:5007/swagger
- Order Service: http://localhost:5009/swagger

### Frontend Applications:
- Unified App (Main): http://localhost:3000
- Rider App: http://localhost:3001
- Customer App: http://localhost:3002
- Admin App: http://localhost:3001

## Database Setup

✅ **Automatic!** Databases are created automatically by Entity Framework Core when you run `dotnet run`.

No manual database setup needed. Just use `dotnet run` and EF Core will create everything.

## Requirements

- .NET 8.0 SDK (for `dotnet run`)
- Node.js 18+ and npm (for frontend)
- SQL Server (LocalDB, Express, or Full Edition) - Must be running
- Multiple terminal/command prompt windows (one per service)

## Tips

- Use `dotnet run` in each service directory to start backend services
- Keep each service running in its own terminal window
- Check the console output to confirm each service started successfully
- If a service fails to start, check the error messages in its terminal
- Make sure SQL Server is running before using `dotnet run` on backend services
- Close terminal windows to stop the services
