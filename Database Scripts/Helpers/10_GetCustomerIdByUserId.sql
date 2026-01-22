-- =============================================
-- Helper Script: Get CustomerId from UserId
-- Use this to find your CustomerId if orders are not displaying
-- =============================================

USE CustomerServiceDB;
GO

-- Get CustomerId for a specific user (replace 'customer1' with your username)
DECLARE @Username NVARCHAR(255) = 'customer1'; -- Change this to your username
DECLARE @UserId INT;
DECLARE @CustomerId INT;

-- Get UserId from AuthServiceDB
SELECT @UserId = UserId 
FROM AuthServiceDB.[dbo].[Users] 
WHERE Username = @Username;

IF @UserId IS NULL
BEGIN
    PRINT '⚠ ERROR: User not found: ' + @Username;
    PRINT '   Please verify the username is correct.';
    RETURN;
END

PRINT '========================================';
PRINT 'Customer ID Lookup';
PRINT '========================================';
PRINT 'Username: ' + @Username;
PRINT 'UserId (from AuthServiceDB): ' + CAST(@UserId AS NVARCHAR(10));
PRINT '';

-- Get CustomerId from CustomerServiceDB
SELECT @CustomerId = CustomerId 
FROM [dbo].[Customers] 
WHERE UserId = @UserId;

IF @CustomerId IS NULL
BEGIN
    PRINT '⚠ ERROR: Customer record not found for UserId: ' + CAST(@UserId AS NVARCHAR(10));
    PRINT '';
    PRINT 'SOLUTION: Create a customer record using this SQL:';
    PRINT '';
    PRINT 'USE CustomerServiceDB;';
    PRINT 'GO';
    PRINT 'INSERT INTO [dbo].[Customers] (UserId, FullName, PhoneNumber, Email, DefaultAddress)';
    PRINT 'VALUES (' + CAST(@UserId AS NVARCHAR(10)) + ', ''Your Name'', ''123-456-7890'', ''your@email.com'', ''Your Address'');';
    PRINT 'GO';
    RETURN;
END

PRINT 'CustomerId (from CustomerServiceDB): ' + CAST(@CustomerId AS NVARCHAR(10));
PRINT '';

-- Check if this customer has any orders
DECLARE @OrderCount INT;
SELECT @OrderCount = COUNT(*) 
FROM OrderServiceDB.[dbo].[Orders] 
WHERE CustomerId = @CustomerId;

PRINT '========================================';
PRINT 'Order Summary';
PRINT '========================================';
PRINT 'CustomerId: ' + CAST(@CustomerId AS NVARCHAR(10));
PRINT 'Number of Orders: ' + CAST(@OrderCount AS NVARCHAR(10));
PRINT '';

IF @OrderCount > 0
BEGIN
    PRINT 'Orders for this customer:';
    PRINT '';
    SELECT 
        OrderId,
        CustomerId,
        CustomerName,
        Status,
        OrderTotal,
        OrderDate
    FROM OrderServiceDB.[dbo].[Orders]
    WHERE CustomerId = @CustomerId
    ORDER BY OrderDate DESC;
    PRINT '';
    PRINT '✓ If the frontend shows no orders, ensure the customerId matches.';
    PRINT '  The frontend uses userId as customerId by default.';
    PRINT '  If they differ, orders may not appear.';
END
ELSE
BEGIN
    PRINT '⚠ No orders found for this customer.';
    PRINT '  Create an order to test the functionality.';
END

PRINT '';
PRINT '========================================';
PRINT 'Frontend Configuration';
PRINT '========================================';
PRINT 'If orders are not displaying in the frontend:';
PRINT '  1. Check if CustomerId (' + CAST(@CustomerId AS NVARCHAR(10)) + ') matches the UserId (' + CAST(@UserId AS NVARCHAR(10)) + ')';
PRINT '  2. If they differ, you may need to:';
PRINT '     - Update orders to use the correct CustomerId, OR';
PRINT '     - Add a backend endpoint to map UserId -> CustomerId';
PRINT '';
PRINT '========================================';
GO
