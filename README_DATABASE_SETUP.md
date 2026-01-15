# Database Setup Guide - UnifiedService

## Overview

UnifiedService uses **5 separate databases** (one for each domain) to maintain data separation while running as a single service.

## Databases Required

1. **AuthServiceDB** - User authentication and authorization
2. **DeliveryServiceDB** - Delivery tracking and status
3. **RiderServiceDB** - Rider information and availability
4. **CustomerServiceDB** - Customer information and order history
5. **OrderServiceDB** - Order management

## Quick Setup

### Option 1: Automatic Setup (Recommended)

UnifiedService automatically creates all databases when it starts. Just run:

```bash
cd Services/UnifiedService
dotnet run
```

The service will:
- Create all 5 databases if they don't exist
- Create all tables automatically
- Initialize the schema

### Option 2: Manual Setup

If you prefer to set up databases manually:

1. **Run the database setup script:**
   ```sql
   -- Execute this script in SQL Server Management Studio
   -- File: Database Scripts/00_SetupAllDatabases.sql
   ```

2. **Create test accounts:**
   ```sql
   -- Execute this script
   -- File: Database Scripts/05_CreateTestAccounts.sql
   ```

3. **Create test order (optional):**
   ```sql
   -- Execute this script
   -- File: Database Scripts/06_CreateTestOrder.sql
   ```

## Connection Strings

All connection strings are configured in `Services/UnifiedService/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "AuthConnection": "Server=localhost;Database=AuthServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
    "DeliveryConnection": "Server=localhost;Database=DeliveryServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
    "RiderConnection": "Server=localhost;Database=RiderServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
    "OrderConnection": "Server=localhost;Database=OrderServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
    "CustomerConnection": "Server=localhost;Database=CustomerServiceDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

## Database Structure

### AuthServiceDB
- `Users` - User accounts with roles (Admin, Rider, Customer)
- `RefreshTokens` - Refresh token management

### DeliveryServiceDB
- `Orders` - Order information
- `Deliveries` - Delivery records and status
- `DeliveryStatusHistory` - Status change history
- `DeliveryProof` - Delivery proof (photos, OTP, signatures)

### RiderServiceDB
- `Riders` - Rider profiles and information
- `RiderAvailability` - Online/offline status
- `RiderEarnings` - Earnings records
- `RiderFeedback` - Customer feedback for riders

### CustomerServiceDB
- `Customers` - Customer profiles
- `CustomerOrders` - Customer order references

### OrderServiceDB
- `Orders` - Order information and status

## Test Accounts

After running the setup scripts, you can use these test accounts:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `password123` |
| Rider | `rider1` | `password123` |
| Customer | `customer1` | `password123` |

## Verification

After UnifiedService starts, check the console output. You should see:
```
Initializing Auth database...
Auth database verified
Initializing Delivery database...
Delivery database verified
...
```

If you see errors, check:
1. SQL Server is running
2. Connection strings are correct
3. You have permissions to create databases

## Troubleshooting

### "Cannot connect to database"
- Verify SQL Server is running
- Check connection strings in `appsettings.json`
- Ensure SQL Server allows Windows Authentication (or update connection string)

### "Database already exists"
- This is normal if databases were created previously
- UnifiedService will use existing databases

### "Table already exists"
- This is normal if tables were created previously
- UnifiedService will use existing tables

---

**Note:** UnifiedService automatically handles database creation and initialization. You typically don't need to run scripts manually unless you want to reset the databases.
