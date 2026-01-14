# How to Seed Rider Data

## Problem: "No riders found" in Admin Dashboard

If you're seeing "No riders found" in the admin dashboard, the database is empty and needs to be seeded with mock data.

## Solution 1: Restart RiderService (Automatic Seeding)

The easiest way is to restart the RiderService - it will automatically seed the data if the database is empty.

### Steps:
1. **Stop the currently running RiderService** (if it's running)
2. **Navigate to RiderService directory:**
   ```powershell
   cd Services\RiderService
   ```
3. **Start the service:**
   ```powershell
   dotnet run
   ```
4. **Wait for the service to start** - you should see a log message:
   - "Database initialized successfully"
   - "Database is empty. Seeding mock rider data..."
   - "Mock rider data seeded successfully"

5. **Refresh your admin app** - you should now see 4 active riders!

## Solution 2: Use the Seed API Endpoint

If the service is already running with the new code:

1. **Open Swagger UI:** http://localhost:5005/swagger
2. **Find the endpoint:** `POST /api/riders/seed`
3. **Click "Try it out"** → **"Execute"**
4. **Refresh your admin app**

Or use PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:5005/api/riders/seed" -Method POST
```

## Solution 3: Run SQL Script Manually

If the above methods don't work, you can run the SQL script directly:

1. **Open SQL Server Management Studio (SSMS)**
2. **Connect to your SQL Server**
3. **Open the file:** `Services\RiderService\SeedRiders.sql`
4. **Execute the script**

## What Data Will Be Created?

After seeding, you'll have:
- **5 Riders total:**
  - 4 Active riders (John Rider, Sarah Driver, Mike Courier, Emma Delivery)
  - 1 Inactive rider (Alex Transport)
- **4 Availability records:**
  - 3 Online riders
  - 1 Offline rider

## Verify It Worked

After seeding, you can verify by:
1. **Check the admin dashboard** - should show 4 riders
2. **Call the API directly:** `GET http://localhost:5005/api/riders`
3. **Check Swagger:** http://localhost:5005/swagger → `GET /api/riders` → Try it out

## Troubleshooting

### Still seeing "No riders found"?

1. **Check if RiderService is running:**
   - Open: http://localhost:5005/swagger
   - If it doesn't load, the service isn't running

2. **Check the service logs:**
   - Look for "Mock rider data seeded successfully" message
   - If you see "Database already contains X riders", the data exists but might not be active

3. **Verify the API is working:**
   - Try: `GET http://localhost:5005/api/riders` in Swagger
   - Should return a JSON array of riders

4. **Check database connection:**
   - Verify SQL Server is running
   - Check connection string in `appsettings.json`

### Database Connection Issues?

If you get database errors:
- Make sure SQL Server is running
- Check the connection string in `Services\RiderService\appsettings.json`
- Default: `Server=localhost;Database=RiderServiceDB;Trusted_Connection=True;TrustServerCertificate=True;`
