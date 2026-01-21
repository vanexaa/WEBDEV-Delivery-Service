# Delivery History Data Flow Documentation

## Overview

This document explains how delivery history data flows from the database to the frontend for both Admin and Rider dashboards. All mock data is stored in the database layer, not hardcoded in frontend components.

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                            │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ DeliveryServiceDB│  │  OrderServiceDB   │                │
│  │  - Deliveries    │  │  - Orders         │                │
│  │  - StatusHistory │  │                   │                │
│  └──────────────────┘  └──────────────────┘                │
│         │                        │                           │
│         └────────────┬───────────┘                           │
│                      │                                       │
│         ┌────────────▼───────────┐                           │
│         │   DatabaseSeeder       │                           │
│         │   (Seeds mock data)    │                           │
│         └────────────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVICE/REPOSITORY LAYER                   │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ DeliveryService  │  │  RiderService    │                │
│  │  - GetAllHistory │  │  - GetRiderHistory│                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTROLLER/API LAYER                        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │DeliveriesController│ │RidersController  │                │
│  │ GET /api/deliveries│ │ GET /api/riders/ │                │
│  │     /history      │ │  {riderId}/history│                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Admin HistoryPage│  │Rider DeliveryHist │                │
│  │  - Fetches all   │  │  - Fetches by     │                │
│  │    deliveries    │  │    riderId       │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Where Mock Data Lives

### Database Tables

**DeliveryServiceDB:**
- `Deliveries` table - Contains delivery records with status, dates, rider assignments
- `DeliveryStatusHistory` table - Tracks status changes

**OrderServiceDB:**
- `Orders` table - Contains order information (customer, address, payment method)

**RiderServiceDB:**
- `Riders` table - Contains rider information (name, contact details)

### Seeder File

**Location:** `Services/UnifiedService/Data/DatabaseSeeder.cs`

**What it does:**
- Creates 50 mock orders in `OrderServiceDB`
- Creates 50 corresponding deliveries in `DeliveryServiceDB`
- Creates 5 mock riders in `RiderServiceDB` (including "Emma Delivery")
- Seeds data on application startup if tables are empty

**When it runs:**
- Automatically on application startup (see `Program.cs`)
- Only seeds if no deliveries exist (prevents duplicate data)

## API Endpoints

### Admin Dashboard

**Endpoint:** `GET /api/deliveries/history`

**Controller:** `Services/UnifiedService/Controllers/DeliveriesController.cs`
- Method: `GetAllDeliveryHistory()`
- Service: `DeliveryService.GetAllDeliveryHistoryAsync()`
- Returns: All deliveries with order information

**Query Parameters:**
- `startDate` (optional): Filter deliveries from this date
- `endDate` (optional): Filter deliveries until this date

### Rider Dashboard

**Endpoint:** `GET /api/riders/{riderId}/history`

**Controller:** `Services/UnifiedService/Controllers/RidersController.cs`
- Method: `GetRiderHistory(int riderId, DateTime? startDate, DateTime? endDate)`
- Service: `RiderService.GetRiderDeliveryHistoryAsync(riderId, startDate, endDate)`
- Returns: Deliveries filtered by riderId with order information

**Query Parameters:**
- `riderId` (required): The ID of the rider
- `startDate` (optional): Filter deliveries from this date
- `endDate` (optional): Filter deliveries until this date

## Frontend Files

### Admin History Page

**File:** `Frontend/unified-app/src/pages/admin/HistoryPage.jsx`

**What it does:**
- Fetches all deliveries from `GET /api/deliveries/history`
- Fetches all riders from `GET /api/riders`
- Computes summary statistics (Total, Completed, Failed) from database results
- Supports client-side filtering by:
  - Rider name
  - Status
  - Payment method
  - Date range
- Supports client-side search by:
  - Transaction code
  - Order ID
  - Rider name
  - Customer name
  - Address
  - Status

**API Service:** `Frontend/unified-app/src/services/api.js`
- Method: `riderService.getAllDeliveryHistory()`
- Method: `riderService.getAllRiders()`

### Rider History Page

**File:** `Frontend/unified-app/src/pages/rider/DeliveryHistoryPage.jsx`

**What it does:**
- Fetches deliveries for logged-in rider from `GET /api/riders/{riderId}/history`
- Computes summary statistics (Total, Completed) from database results
- Supports client-side filtering by:
  - Date range (All Time, Today, Last 7 Days, Last 30 Days)
- Supports client-side search by:
  - Transaction code
  - Customer name
  - Address
  - Status

**API Service:** `Frontend/unified-app/src/services/api.js`
- Method: `riderService.getRiderHistory(riderId, startDate, endDate)`

## Key Points

### ✅ No Hardcoded Data in Frontend

- All mock data is stored in the database
- Frontend only fetches data via API calls
- No arrays, objects, or hardcoded values in frontend components

### ✅ Database as Single Source of Truth

- Mock data is seeded into database tables
- Frontend receives data from database through API
- Can replace mock data with real production data without changing frontend code

### ✅ Clear Separation of Concerns

1. **Database Layer:** Stores data (mock or real)
2. **Service Layer:** Business logic and data retrieval
3. **Controller Layer:** API endpoints
4. **Frontend Layer:** UI and user interactions

## Replacing Mock Data with Production Data

To replace mock data with real production data:

1. **Stop seeding mock data:**
   - Comment out or remove the seeder call in `Program.cs`
   - Or modify `DatabaseSeeder.cs` to check for production environment

2. **Use real data sources:**
   - Orders will come from actual order creation flow
   - Deliveries will be created when orders are assigned
   - Riders will be registered through the rider registration flow

3. **No frontend changes needed:**
   - Frontend code remains unchanged
   - API endpoints remain the same
   - Data structure remains compatible

## Files Summary

### Backend Files

| File | Purpose |
|------|---------|
| `Services/UnifiedService/Data/DatabaseSeeder.cs` | Seeds mock data into database |
| `Services/UnifiedService/Program.cs` | Calls seeder on startup |
| `Services/UnifiedService/Services/DeliveryService.cs` | Business logic for deliveries |
| `Services/UnifiedService/Services/RiderService.cs` | Business logic for rider history |
| `Services/UnifiedService/Controllers/DeliveriesController.cs` | Admin delivery history API |
| `Services/UnifiedService/Controllers/RidersController.cs` | Rider delivery history API |

### Frontend Files

| File | Purpose |
|------|---------|
| `Frontend/unified-app/src/pages/admin/HistoryPage.jsx` | Admin delivery history page |
| `Frontend/unified-app/src/pages/rider/DeliveryHistoryPage.jsx` | Rider delivery history page |
| `Frontend/unified-app/src/services/api.js` | API service methods |

### Database Tables

| Database | Table | Contains |
|----------|-------|----------|
| DeliveryServiceDB | Deliveries | Delivery records |
| DeliveryServiceDB | DeliveryStatusHistory | Status change history |
| OrderServiceDB | Orders | Order information |
| RiderServiceDB | Riders | Rider information |

## Testing

To verify the data flow:

1. **Start the backend:**
   ```bash
   cd Services/UnifiedService
   dotnet run
   ```
   - Check logs for "Database seeding completed successfully!"

2. **Verify database:**
   - Check `DeliveryServiceDB.Deliveries` table - should have 50 records
   - Check `OrderServiceDB.Orders` table - should have 50 records
   - Check `RiderServiceDB.Riders` table - should have 5 records

3. **Test Admin page:**
   - Navigate to Admin Dashboard → Delivery History
   - Should show 50 deliveries with summary cards populated

4. **Test Rider page:**
   - Login as a rider (e.g., Emma Delivery, riderId: 2)
   - Navigate to Rider Dashboard → History
   - Should show deliveries assigned to that rider

## Notes

- Mock data is only seeded if tables are empty (prevents duplicates)
- Date filtering can be done on backend (via query params) or frontend (client-side)
- Search and additional filters are currently client-side for better UX
- All data comes from database - no hardcoded arrays or objects in frontend
