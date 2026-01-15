-- =============================================
-- Create Test Order for Testing Data Flow
-- This script creates a test order that can be used to verify
-- order creation, delivery assignment, and tracking functionality
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

-- Check if test order already exists and delete it
IF EXISTS (SELECT 1 FROM [dbo].[Orders] WHERE [CustomerId] = @CustomerId AND [CustomerName] = 'Test Customer')
BEGIN
    PRINT '⚠ Test order already exists. Deleting old test order...';
    DELETE FROM [dbo].[Orders] WHERE [CustomerId] = @CustomerId AND [CustomerName] = 'Test Customer';
    PRINT '✓ Old test order deleted';
END

-- Create test order (using only columns that exist)
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

PRINT '';
PRINT '✓ Test order created successfully!';
PRINT '';
PRINT '========================================';
PRINT 'Test Order Details';
PRINT '========================================';
PRINT '  Order ID: ' + CAST(@OrderId AS NVARCHAR(10));
PRINT '  Customer ID: ' + CAST(@CustomerId AS NVARCHAR(10));
PRINT '  Customer Name: Test Customer';
PRINT '  Customer Phone: 123-456-7890';
PRINT '  Order Total: $25.99';
PRINT '  Payment Method: COD (Cash on Delivery)';
PRINT '  Status: Pending';
PRINT '  Delivery Address: 123 Main Street, Test City, TC 12345';
PRINT '  Special Instructions: Please ring doorbell twice. Leave package at front door if no answer.';
PRINT '';
PRINT '========================================';
PRINT 'Testing Instructions';
PRINT '========================================';
PRINT '';
PRINT '1. TEST ORDER CREATION:';
PRINT '   - Order ID ' + CAST(@OrderId AS NVARCHAR(10)) + ' should appear in OrderService';
PRINT '';
PRINT '2. TEST DELIVERY ASSIGNMENT (Admin App):';
PRINT '   - Login as admin (admin / password123)';
PRINT '   - Go to Deliveries page';
PRINT '   - Assign Order ID ' + CAST(@OrderId AS NVARCHAR(10)) + ' to a rider';
PRINT '   - Verify delivery record is created in DeliveryService';
PRINT '';
PRINT '3. TEST ORDER TRACKING (Customer App):';
PRINT '   - Login as customer1 (customer1 / password123)';
PRINT '   - Track Order ID ' + CAST(@OrderId AS NVARCHAR(10));
PRINT '   - Verify order status and delivery information displays';
PRINT '';
PRINT '4. TEST DELIVERY UPDATES (Rider App):';
PRINT '   - Login as rider1 (rider1 / password123)';
PRINT '   - View assigned orders';
PRINT '   - Update delivery status (Picked Up, In Transit, Delivered)';
PRINT '   - Verify status updates reflect in customer app';
PRINT '';
PRINT '5. TEST ADMIN DASHBOARD:';
PRINT '   - View all orders in admin app';
PRINT '   - View all deliveries';
PRINT '   - View all riders';
PRINT '';
PRINT '========================================';
PRINT 'Test Accounts';
PRINT '========================================';
PRINT '  Customer: customer1 / password123';
PRINT '  Rider:    rider1 / password123';
PRINT '  Admin:    admin / password123';
PRINT '';
PRINT '========================================';
PRINT 'Script completed successfully!';
PRINT '========================================';
PRINT '';
