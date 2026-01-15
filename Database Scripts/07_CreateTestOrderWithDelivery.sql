-- =============================================
-- Create Test Order with Delivery and Rider Assignment
-- This script creates a complete test scenario:
-- 1. Creates a test order
-- 2. Creates a delivery for that order
-- 3. Creates a rider record (if needed)
-- 4. Assigns the rider to the delivery
-- Run this AFTER running 00_SetupAllDatabases.sql and 05_CreateTestAccounts.sql
-- =============================================

USE CustomerServiceDB;
GO

-- Create customer record for customer1 if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM [dbo].[Customers] WHERE UserId = (SELECT UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'customer1'))
BEGIN
    DECLARE @CustomerUserId INT;
    SELECT @CustomerUserId = UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'customer1';
    
    IF @CustomerUserId IS NOT NULL
    BEGIN
        INSERT INTO [dbo].[Customers] (UserId, FullName, PhoneNumber, Email, DefaultAddress)
        VALUES (@CustomerUserId, 'Test Customer', '123-456-7890', 'customer1@example.com', '123 Main Street, Test City, TC 12345');
        PRINT '✓ Customer record created for customer1';
    END
    ELSE
    BEGIN
        PRINT '⚠ ERROR: customer1 user not found. Please run 05_CreateTestAccounts.sql first.';
    END
END
ELSE
BEGIN
    PRINT '✓ Customer record already exists for customer1';
END
GO

-- =============================================
-- STEP 1: Create Order
-- =============================================
USE OrderServiceDB;
GO

PRINT '';
PRINT '========================================';
PRINT 'Creating Test Order';
PRINT '========================================';
PRINT '';

-- Get CustomerId for customer1
DECLARE @CustomerId INT;
SELECT @CustomerId = CustomerId 
FROM CustomerServiceDB.[dbo].[Customers] 
WHERE UserId = (SELECT UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'customer1');

IF @CustomerId IS NULL
BEGIN
    PRINT '⚠ ERROR: Customer record not found. Please ensure customer1 exists.';
    RETURN;
END

PRINT 'Found CustomerId: ' + CAST(@CustomerId AS NVARCHAR(10));

-- Delete existing test order if it exists
IF EXISTS (SELECT 1 FROM [dbo].[Orders] WHERE [CustomerId] = @CustomerId AND [CustomerName] = 'Test Customer')
BEGIN
    DECLARE @ExistingOrderId INT;
    SELECT @ExistingOrderId = OrderId FROM [dbo].[Orders] WHERE [CustomerId] = @CustomerId AND [CustomerName] = 'Test Customer';
    
    -- Delete related delivery first
    USE DeliveryServiceDB;
    DELETE FROM [dbo].[Deliveries] WHERE OrderId = @ExistingOrderId;
    
    USE OrderServiceDB;
    DELETE FROM [dbo].[Orders] WHERE OrderId = @ExistingOrderId;
    PRINT '⚠ Old test order and delivery deleted';
END

-- Create test order
INSERT INTO [dbo].[Orders] (
    [CustomerId],
    [CustomerName],
    [CustomerPhone],
    [DeliveryAddress],
    [SpecialInstructions],
    [OrderTotal],
    [PaymentMethod],
    [Status],
    [OrderDate]
)
VALUES (
    @CustomerId,
    'Test Customer',
    '123-456-7890',
    '123 Main Street, Test City, TC 12345',
    'Please ring doorbell twice. Leave package at front door if no answer.',
    25.99,
    'COD',
    'Pending',
    GETUTCDATE()
);

DECLARE @OrderId INT = SCOPE_IDENTITY();
PRINT '✓ Test order created: OrderId = ' + CAST(@OrderId AS NVARCHAR(10));
GO

-- =============================================
-- STEP 2: Create Rider Record (if needed)
-- =============================================
USE RiderServiceDB;
GO

DECLARE @RiderUserId INT;
SELECT @RiderUserId = UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'rider1';

IF @RiderUserId IS NULL
BEGIN
    PRINT '⚠ ERROR: rider1 user not found. Please run 05_CreateTestAccounts.sql first.';
    RETURN;
END

DECLARE @RiderId INT;

-- Check if rider record exists
IF NOT EXISTS (SELECT 1 FROM [dbo].[Riders] WHERE UserId = @RiderUserId)
BEGIN
    -- Create rider record
    INSERT INTO [dbo].[Riders] (UserId, FullName, PhoneNumber, Email, VehicleType, VehicleNumber, IsActive)
    VALUES (@RiderUserId, 'John Doe', '555-123-4567', 'rider1@restaurant.com', 'Motorcycle', 'ABC-1234', 1);
    
    SET @RiderId = SCOPE_IDENTITY();
    PRINT '✓ Rider record created: RiderId = ' + CAST(@RiderId AS NVARCHAR(10));
    
    -- Create rider availability
    INSERT INTO [dbo].[RiderAvailability] (RiderId, IsOnline, LastUpdated)
    VALUES (@RiderId, 1, GETUTCDATE());
    PRINT '✓ Rider availability created';
END
ELSE
BEGIN
    SELECT @RiderId = RiderId FROM [dbo].[Riders] WHERE UserId = @RiderUserId;
    PRINT '✓ Rider record already exists: RiderId = ' + CAST(@RiderId AS NVARCHAR(10));
    
    -- Ensure availability exists
    IF NOT EXISTS (SELECT 1 FROM [dbo].[RiderAvailability] WHERE RiderId = @RiderId)
    BEGIN
        INSERT INTO [dbo].[RiderAvailability] (RiderId, IsOnline, LastUpdated)
        VALUES (@RiderId, 1, GETUTCDATE());
        PRINT '✓ Rider availability created';
    END
END
GO

-- =============================================
-- STEP 3: Create Delivery and Assign Rider
-- =============================================
USE DeliveryServiceDB;
GO

-- Get OrderId and RiderId from previous steps
DECLARE @OrderId INT;
SELECT @OrderId = OrderId 
FROM OrderServiceDB.[dbo].[Orders] 
WHERE CustomerId = (SELECT CustomerId FROM CustomerServiceDB.[dbo].[Customers] WHERE UserId = (SELECT UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'customer1'))
AND CustomerName = 'Test Customer';

DECLARE @RiderId INT;
SELECT @RiderId = RiderId 
FROM RiderServiceDB.[dbo].[Riders] 
WHERE UserId = (SELECT UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'rider1');

IF @OrderId IS NULL OR @RiderId IS NULL
BEGIN
    PRINT '⚠ ERROR: Could not find OrderId or RiderId';
    RETURN;
END

-- First, create DeliveryOrder record (required by DeliveryService)
-- This is a copy of the order in DeliveryServiceDB
IF NOT EXISTS (SELECT 1 FROM [dbo].[Orders] WHERE OrderId = @OrderId)
BEGIN
    INSERT INTO [dbo].[Orders] (
        [OrderId],
        [CustomerId],
        [CustomerName],
        [CustomerPhone],
        [DeliveryAddress],
        [SpecialInstructions],
        [OrderTotal],
        [PaymentMethod],
        [OrderDate],
        [Status]
    )
    SELECT 
        [OrderId],
        [CustomerId],
        [CustomerName],
        [CustomerPhone],
        [DeliveryAddress],
        [SpecialInstructions],
        [OrderTotal],
        [PaymentMethod],
        [OrderDate],
        [Status]
    FROM OrderServiceDB.[dbo].[Orders]
    WHERE OrderId = @OrderId;
    
    PRINT '✓ DeliveryOrder record created in DeliveryServiceDB';
END
ELSE
BEGIN
    PRINT '✓ DeliveryOrder record already exists in DeliveryServiceDB';
END

-- Delete existing delivery if it exists
IF EXISTS (SELECT 1 FROM [dbo].[Deliveries] WHERE OrderId = @OrderId)
BEGIN
    DELETE FROM [dbo].[Deliveries] WHERE OrderId = @OrderId;
    PRINT '⚠ Old delivery deleted';
END

-- Create delivery with rider assigned
-- Note: Based on the schema, Deliveries table has: OrderId, RiderId, Status, AssignedAt, PickedUpAt, DeliveredAt, FailedAt, FailureReason, CreatedAt, UpdatedAt
INSERT INTO [dbo].[Deliveries] (
    [OrderId],
    [RiderId],
    [Status],
    [AssignedAt],
    [CreatedAt],
    [UpdatedAt]
)
VALUES (
    @OrderId,
    @RiderId,
    'Assigned',
    GETUTCDATE(),
    GETUTCDATE(),
    GETUTCDATE()
);

DECLARE @DeliveryId INT = SCOPE_IDENTITY();
PRINT '✓ Delivery created and assigned to rider: DeliveryId = ' + CAST(@DeliveryId AS NVARCHAR(10));
PRINT '  OrderId: ' + CAST(@OrderId AS NVARCHAR(10));
PRINT '  RiderId: ' + CAST(@RiderId AS NVARCHAR(10));
GO

-- =============================================
-- Summary
-- =============================================
PRINT '';
PRINT '========================================';
PRINT 'Test Data Created Successfully!';
PRINT '========================================';
PRINT '';

USE OrderServiceDB;
DECLARE @OrderId INT;
SELECT @OrderId = OrderId 
FROM [dbo].[Orders] 
WHERE CustomerId = (SELECT CustomerId FROM CustomerServiceDB.[dbo].[Customers] WHERE UserId = (SELECT UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'customer1'))
AND CustomerName = 'Test Customer';

USE RiderServiceDB;
DECLARE @RiderId INT;
SELECT @RiderId = RiderId 
FROM [dbo].[Riders] 
WHERE UserId = (SELECT UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'rider1');

USE DeliveryServiceDB;
DECLARE @DeliveryId INT;
SELECT @DeliveryId = DeliveryId 
FROM [dbo].[Deliveries] 
WHERE OrderId = @OrderId;

PRINT 'Order ID: ' + CAST(@OrderId AS NVARCHAR(10));
PRINT 'Rider ID: ' + CAST(@RiderId AS NVARCHAR(10));
PRINT 'Delivery ID: ' + CAST(@DeliveryId AS NVARCHAR(10));
PRINT '';
PRINT '========================================';
PRINT 'How to Test RiderInfoCard:';
PRINT '========================================';
PRINT '';
PRINT '1. Start the backend:';
PRINT '   cd Services\UnifiedService';
PRINT '   dotnet run';
PRINT '';
PRINT '2. Start the frontend:';
PRINT '   cd Frontend\unified-app';
PRINT '   npm run dev';
PRINT '';
PRINT '3. Login as Customer:';
PRINT '   - Go to: http://localhost:3000';
PRINT '   - Username: customer1';
PRINT '   - Password: password123';
PRINT '';
PRINT '4. Track the order:';
PRINT '   - Enter Order ID: ' + CAST(@OrderId AS NVARCHAR(10));
PRINT '   - Click "Track Order"';
PRINT '   - You should see the RiderInfoCard with:';
PRINT '     * Driver Name: John Doe';
PRINT '     * Rating: 5.0 (default)';
PRINT '     * Plate #: ABC-1234';
PRINT '';
PRINT '========================================';
PRINT 'Script completed successfully!';
PRINT '========================================';
PRINT '';
