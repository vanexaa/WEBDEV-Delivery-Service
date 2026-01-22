# WEBDEV Delivery Service

A full-stack delivery management system with a .NET backend API and React frontend.

## Prerequisites

Before running the application, ensure you have the following installed:

- **Backend:**
  - [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
  - [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (or SQL Server)
  - [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms) (optional, for database management)

- **Frontend:**
  - [Node.js](https://nodejs.org/) (v18 or higher recommended)
  - npm (comes with Node.js)

---

## Database Setup

1. Open SQL Server Management Studio and connect to your SQL Server instance.

2. Run the database setup scripts in order from the `Database Scripts/setup/` folder:
   ```sql
   -- Run this first to create all databases
   00_SetupAllDatabases.sql
   02_CreateStoredProcedures.sql
   ```

3. (Optional) Seed test data from `Database Scripts/Data seed/`:
   ```sql
   05_CreateTestAccounts.sql
   09_CreateRiderRecord.sql
   10_CreateAdditionalTestData.sql
   ```

4. Update the connection strings in `Services/UnifiedService/appsettings.json` to match your SQL Server instance:
   ```json
   "ConnectionStrings": {
     "AuthConnection": "Server=YOUR_SERVER\\SQLEXPRESS;Database=AuthServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
     "DeliveryConnection": "Server=YOUR_SERVER\\SQLEXPRESS;Database=DeliveryServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
     "RiderConnection": "Server=YOUR_SERVER\\SQLEXPRESS;Database=RiderServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
     "OrderConnection": "Server=YOUR_SERVER\\SQLEXPRESS;Database=OrderServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
     "CustomerConnection": "Server=YOUR_SERVER\\SQLEXPRESS;Database=CustomerServiceDB;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```

---

## Running the Backend

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd WEBDEV-Delivery-Service/Services/UnifiedService
   ```

2. Restore dependencies and build:
   ```bash
   dotnet restore
   dotnet build
   ```

3. Run the backend server:
   ```bash
   dotnet run
   ```

4. The API will be available at:
   - **API Base URL:** `http://localhost:5000`
   - **Swagger UI:** `http://localhost:5000` (opens automatically in development)

---

## Running the Frontend

1. Open a **new terminal** and navigate to the frontend directory:
   ```bash
   cd WEBDEV-Delivery-Service/Frontend/unified-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The frontend will be available at:
   - **Frontend URL:** `http://localhost:5173`

---

## Quick Start (Both Services)

**Terminal 1 - Backend:**
```bash
cd WEBDEV-Delivery-Service/Services/UnifiedService
dotnet run
```

**Terminal 2 - Frontend:**
```bash
cd WEBDEV-Delivery-Service/Frontend/unified-app
npm install   # Only needed first time
npm run dev
```

---

## Test Accounts

If you ran the test data seed scripts, the following accounts are available:

| Role     | Username   | Password     |
|----------|------------|--------------|
| Admin    | `admin`    | `admin123`   |
| Rider    | `rider1`   | `rider123`   |
| Customer | `customer` | `customer123`|

---

## API Endpoints

The backend exposes the following API routes:

| Endpoint                    | Description                    |
|-----------------------------|--------------------------------|
| `POST /api/auth/login`      | User authentication            |
| `POST /api/auth/register`   | User registration              |
| `GET /api/orders`           | Get orders                     |
| `GET /api/deliveries`       | Get deliveries                 |
| `GET /api/riders`           | Get riders                     |
| `GET /api/customers`        | Get customers                  |

For full API documentation, visit Swagger UI at `http://localhost:5000` when the backend is running.

---

## Project Structure

```
WEBDEV-Delivery-Service/
├── Database Scripts/          # SQL scripts for database setup
│   ├── setup/                 # Database creation scripts
│   ├── Data seed/             # Test data scripts
│   └── maintenance/           # Database maintenance scripts
├── Frontend/
│   └── unified-app/           # React + Vite frontend
│       ├── src/
│       │   ├── components/    # Reusable React components
│       │   ├── pages/         # Page components (admin, customer, rider)
│       │   ├── services/      # API service layer
│       │   └── utils/         # Utility functions and context
│       └── package.json
└── Services/
    └── UnifiedService/        # .NET 8 Backend API
        ├── Controllers/       # API controllers
        ├── Data/              # Database contexts
        ├── Models/            # Entity and DTO models
        ├── Services/          # Business logic services
        └── appsettings.json   # Configuration
```

---

## Troubleshooting

### Backend won't start
- Ensure SQL Server is running
- Verify connection strings in `appsettings.json`
- Check that databases exist (run setup scripts)

### Frontend can't connect to backend
- Ensure backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Verify the API URL in `Frontend/unified-app/src/services/api.js`

### Database errors
- Run the setup scripts in order
- Check SQL Server instance name matches your configuration

---

## Technologies Used

- **Backend:** .NET 8, Entity Framework Core, SQL Server, JWT Authentication
- **Frontend:** React 18, Vite, React Router, Bootstrap 5
- **Database:** SQL Server with Stored Procedures
