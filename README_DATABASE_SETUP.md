# Database Setup Guide

## Automatic Database Creation (Recommended)

The services use **Entity Framework Core** to automatically create databases and tables when they start.

### How It Works

When you run any service using `dotnet run`, EF Core will:
- Automatically create the database if it doesn't exist
- Create all tables based on the DbContext models
- Set up all indexes and relationships

**No manual SQL scripts needed!**

### Starting Services

Simply run the services and databases will be created automatically:

```bash
# Run all services
cd Services
dotnet run --project AuthService/AuthService.csproj
dotnet run --project DeliveryService/DeliveryService.csproj
dotnet run --project RiderService/RiderService.csproj
dotnet run --project CustomerService/CustomerService.csproj
dotnet run --project OrderService/OrderService.csproj
```

Or use the startup script:
```powershell
.\start-backend.ps1
```

## Databases Created

The following databases will be automatically created:

1. **AuthServiceDB** - User authentication and authorization
2. **DeliveryServiceDB** - Delivery tracking and status
3. **RiderServiceDB** - Rider information and availability
4. **CustomerServiceDB** - Customer information and order history
5. **OrderServiceDB** - Order management

## Manual Setup (Optional - SQL Scripts)

If you prefer to set up databases manually using SQL scripts, you can use:

- `Database Scripts/00_SetupAllDatabases.sql` - Creates all databases and tables

**Note:** Manual setup is optional since EF Core handles everything automatically.

## Requirements

- SQL Server (LocalDB, Express, or Full Edition) - Must be installed and running
- .NET 8.0 SDK
- Entity Framework Core (already included in the projects)

## Troubleshooting

### Database Creation Errors

If you get database creation errors:

1. **SQL Server not running:**
   - Make sure SQL Server is installed and running
   - Check if SQL Server Browser service is running
   - Verify connection string in `appsettings.json`

2. **Connection string issues:**
   - Default uses: `Server=localhost;Database=...;Trusted_Connection=True;TrustServerCertificate=True;`
   - For SQL Server Express, use: `Server=localhost\SQLEXPRESS;Database=...;Trusted_Connection=True;TrustServerCertificate=True;`
   - Update connection strings in each service's `appsettings.json` if needed

3. **Permissions:**
   - Ensure your SQL Server login has permissions to create databases
   - Windows Authentication should work by default

### Viewing Databases

After services start, you can verify databases were created:
- Open SQL Server Management Studio (SSMS)
- Connect to your SQL Server instance
- Check Object Explorer for the created databases

## Test Accounts

After the first run, you can create test accounts using:
- `Database Scripts/01_CreateTestAccounts.sql` (optional)

Test account credentials (if created):
- **Admin:** username: `admin`, password: `password123`
- **Rider:** username: `rider1`, password: `password123`
- **Customer:** username: `customer1`, password: `password123`
