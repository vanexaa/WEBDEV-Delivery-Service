# Debugging Pending Orders Not Showing for Rider

## Quick Diagnosis Steps

### 1. Check Backend Logs
Look for these log messages in your backend console:
- `GetRiderOrdersAsync called for RiderId=X`
- `Found X active deliveries for RiderId=X`
- `Total deliveries for RiderId=X (any status): X`
- `OrderAssignmentBackgroundService: Found X pending orders`

### 2. Verify Order Status in Database

Run these SQL queries:

```sql
-- Check if order exists and its status
SELECT OrderId, Status, CustomerId, OrderDate 
FROM OrderServiceDB.dbo.Orders 
WHERE Status = 'Pending'
ORDER BY OrderDate DESC;

-- Check if delivery exists for the order
SELECT DeliveryId, OrderId, RiderId, Status, AssignedAt, CreatedAt
FROM DeliveryServiceDB.dbo.Deliveries
WHERE OrderId = [YOUR_ORDER_ID];

-- Check all deliveries for a specific rider
SELECT DeliveryId, OrderId, RiderId, Status, AssignedAt
FROM DeliveryServiceDB.dbo.Deliveries
WHERE RiderId = [YOUR_RIDER_ID]
ORDER BY CreatedAt DESC;

-- Check rider availability
SELECT RiderId, IsOnline, LastSeen
FROM RiderServiceDB.dbo.RiderAvailability
WHERE RiderId = [YOUR_RIDER_ID];
```

### 3. Common Issues and Fixes

#### Issue 1: Order Exists but No Delivery Record
**Symptom**: Order in OrderServiceDB with Status='Pending', but no delivery in DeliveryServiceDB

**Fix**: 
- Ensure the background service is running (check logs for "OrderAssignmentBackgroundService started")
- Wait 30 seconds for the background service to pick it up
- Or manually trigger assignment by calling the assign endpoint

#### Issue 2: Delivery Exists but Status is "Pending" not "Assigned"
**Symptom**: Delivery exists but Status='Pending' instead of 'Assigned'

**Fix**: Update the delivery status:
```sql
UPDATE DeliveryServiceDB.dbo.Deliveries
SET Status = 'Assigned'
WHERE OrderId = [YOUR_ORDER_ID] AND Status = 'Pending';
```

#### Issue 3: RiderId Mismatch
**Symptom**: Delivery exists but RiderId doesn't match the logged-in rider

**Check**: 
- Verify the riderId in the frontend (check browser console)
- Verify the RiderId in the DeliveryServiceDB
- Make sure you're logged in as the correct rider

#### Issue 4: Rider Not Online
**Symptom**: Rider is offline, so orders won't auto-assign

**Fix**: 
- Log in as the rider
- Toggle the "Available" button to go online
- The background service will assign pending orders within 30 seconds

### 4. Manual Assignment (For Testing)

If you need to manually assign an order:

**Via API:**
```bash
POST http://localhost:5000/api/deliveries/assign
Authorization: Bearer YOUR_TOKEN
{
  "orderId": [ORDER_ID],
  "riderId": [RIDER_ID]
}
```

**Via SQL:**
```sql
-- First, create or update the delivery
IF EXISTS (SELECT 1 FROM DeliveryServiceDB.dbo.Deliveries WHERE OrderId = [ORDER_ID])
    UPDATE DeliveryServiceDB.dbo.Deliveries
    SET RiderId = [RIDER_ID], Status = 'Assigned', AssignedAt = GETUTCDATE()
    WHERE OrderId = [ORDER_ID]
ELSE
    INSERT INTO DeliveryServiceDB.dbo.Deliveries (OrderId, RiderId, Status, AssignedAt, CreatedAt, UpdatedAt)
    VALUES ([ORDER_ID], [RIDER_ID], 'Assigned', GETUTCDATE(), GETUTCDATE(), GETUTCDATE());
```

### 5. Frontend Debugging

Open browser console (F12) and check for:
- `[DashboardPage] Loading orders for riderId: X`
- `[DashboardPage] Rider orders API response: [...]`
- `[DashboardPage] No orders returned from API`

If you see "No orders returned", check the API response in Network tab:
- Go to Network tab
- Filter by "orders"
- Click on the request to `/api/riders/{riderId}/orders`
- Check the Response - it should be an array

### 6. Expected Flow

1. Order created → Status='Pending' in OrderServiceDB
2. Auto-assignment runs → Creates delivery with Status='Assigned' and RiderId set
3. Background service runs (every 30s) → Assigns any remaining pending orders
4. Frontend polls (every 10s) → Calls `/api/riders/{riderId}/orders`
5. Backend returns deliveries with Status IN ('Assigned', 'Accepted', 'PickedUp', 'InTransit')
6. Frontend displays orders with Accept/Reject buttons

If any step fails, orders won't show up!
