-- =============================================
-- Create Deliveries for Existing Orders
-- This script creates deliveries for orders that don't have deliveries yet
-- Run this if you have orders but no deliveries
-- =============================================

USE DeliveryServiceDB;
GO

PRINT '';
PRINT '========================================';
PRINT 'Creating Deliveries for Existing Orders';
PRINT '========================================';
PRINT '';

-- Get a rider to assign (use rider1)
DECLARE @RiderId INT;
SELECT @RiderId = RiderId 
FROM RiderServiceDB.[dbo].[Riders] 
WHERE UserId = (SELECT UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'rider1');

IF @RiderId IS NULL
BEGIN
    PRINT '⚠ ERROR: No rider found. Please ensure rider1 exists.';
    PRINT '   Run 05_CreateTestAccounts.sql and create a rider record first.';
    RETURN;
END

PRINT 'Using RiderId: ' + CAST(@RiderId AS NVARCHAR(10));
PRINT '';

-- Get all orders from OrderServiceDB that don't have deliveries
DECLARE @OrdersToProcess TABLE (
    OrderId INT,
    CustomerName NVARCHAR(255),
    DeliveryAddress NVARCHAR(500)
);

INSERT INTO @OrdersToProcess (OrderId, CustomerName, DeliveryAddress)
SELECT 
    o.OrderId,
    o.CustomerName,
    o.DeliveryAddress
FROM OrderServiceDB.[dbo].[Orders] o
WHERE NOT EXISTS (
    SELECT 1 
    FROM DeliveryServiceDB.[dbo].[Deliveries] d 
    WHERE d.OrderId = o.OrderId
)
AND o.Status != 'Cancelled';

DECLARE @OrderCount INT;
SELECT @OrderCount = COUNT(*) FROM @OrdersToProcess;

IF @OrderCount = 0
BEGIN
    PRINT '✓ All orders already have deliveries.';
    RETURN;
END

PRINT 'Found ' + CAST(@OrderCount AS NVARCHAR(10)) + ' orders without deliveries.';
PRINT '';

-- Process each order
DECLARE @CurrentOrderId INT;
DECLARE @CurrentCustomerName NVARCHAR(255);
DECLARE @CurrentDeliveryAddress NVARCHAR(500);

DECLARE order_cursor CURSOR FOR
SELECT OrderId, CustomerName, DeliveryAddress FROM @OrdersToProcess;

OPEN order_cursor;
FETCH NEXT FROM order_cursor INTO @CurrentOrderId, @CurrentCustomerName, @CurrentDeliveryAddress;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Check if order exists in OrderServiceDB
    IF EXISTS (SELECT 1 FROM OrderServiceDB.[dbo].[Orders] WHERE OrderId = @CurrentOrderId)
    BEGIN
        -- Create delivery
        INSERT INTO [dbo].[Deliveries] (
            [OrderId],
            [RiderId],
            [Status],
            [AssignedAt],
            [CreatedAt],
            [UpdatedAt]
        )
        VALUES (
            @CurrentOrderId,
            @RiderId,
            'Assigned',
            GETUTCDATE(),
            GETUTCDATE(),
            GETUTCDATE()
        );

        DECLARE @NewDeliveryId INT = SCOPE_IDENTITY();
        PRINT '✓ Created delivery for OrderId ' + CAST(@CurrentOrderId AS NVARCHAR(10)) + ' (DeliveryId: ' + CAST(@NewDeliveryId AS NVARCHAR(10)) + ')';
        PRINT '  Customer: ' + @CurrentCustomerName;
        PRINT '  Address: ' + @CurrentDeliveryAddress;
        PRINT '';
    END
    ELSE
    BEGIN
        PRINT '⚠ OrderId ' + CAST(@CurrentOrderId AS NVARCHAR(10)) + ' not found in OrderServiceDB';
    END

    FETCH NEXT FROM order_cursor INTO @CurrentOrderId, @CurrentCustomerName, @CurrentDeliveryAddress;
END

CLOSE order_cursor;
DEALLOCATE order_cursor;

PRINT '========================================';
PRINT 'Summary';
PRINT '========================================';
PRINT '';

-- Show all deliveries
SELECT 
    d.DeliveryId,
    d.OrderId,
    d.RiderId,
    d.Status,
    d.AssignedAt,
    o.CustomerName,
    o.DeliveryAddress
FROM [dbo].[Deliveries] d
LEFT JOIN OrderServiceDB.[dbo].[Orders] o ON o.OrderId = d.OrderId
ORDER BY d.OrderId;

PRINT '';
PRINT '========================================';
PRINT 'Script completed!';
PRINT '========================================';
PRINT '';
PRINT 'To test:';
PRINT '  1. Try tracking OrderId 1, 2, or 5 in the customer app';
PRINT '  2. You should now see delivery information and rider info';
PRINT '';
