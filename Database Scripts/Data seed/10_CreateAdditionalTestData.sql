-- =============================================
-- Seed Backend Users, Customers, and Orders
-- Safe to re-run (no destructive operations)
-- =============================================

-- =============================================
-- AuthService User Seed
-- =============================================
USE AuthServiceDB;
GO

-- Known password for test users: password123 (BCrypt hash used below)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE Username = 'customer2')
BEGIN
    INSERT INTO [dbo].[Users] (Username, Email, PasswordHash, Role, IsActive)
    VALUES (
        'customer2',
        'customer2@example.com',
        '$2a$11$4CYz5KtPgviORwjX6zbnkuLlOnNwPU7f4.jUP6NMIy.azxoLM122u',
        'Customer',
        1
    );
    PRINT 'OK: Auth user created for customer2.';
END
ELSE
BEGIN
    PRINT 'OK: Auth user already exists for customer2.';
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE Username = 'rider2')
BEGIN
    INSERT INTO [dbo].[Users] (Username, Email, PasswordHash, Role, IsActive)
    VALUES (
        'rider2',
        'rider2@restaurant.com',
        '$2a$11$4CYz5KtPgviORwjX6zbnkuLlOnNwPU7f4.jUP6NMIy.azxoLM122u',
        'Rider',
        1
    );
    PRINT 'OK: Auth user created for rider2.';
END
ELSE
BEGIN
    PRINT 'OK: Auth user already exists for rider2.';
END
GO

-- =============================================
-- Customer Seed
-- =============================================
USE CustomerServiceDB;
GO

DECLARE @CustomerUserId INT;
SELECT @CustomerUserId = UserId
FROM AuthServiceDB.[dbo].[Users]
WHERE Username = 'customer2' AND Role = 'Customer';

IF @CustomerUserId IS NULL
BEGIN
    PRINT 'WARNING: customer2 user not found in AuthServiceDB after auth seed.';
    RETURN;
END

DECLARE @CustomerId INT;

IF EXISTS (SELECT 1 FROM [dbo].[Customers] WHERE UserId = @CustomerUserId)
BEGIN
    SELECT @CustomerId = CustomerId FROM [dbo].[Customers] WHERE UserId = @CustomerUserId;
    PRINT 'OK: Customer record already exists for customer2.';
    PRINT 'UserId: ' + CAST(@CustomerUserId AS NVARCHAR(10));
    PRINT 'CustomerId: ' + CAST(@CustomerId AS NVARCHAR(10));
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[Customers] WHERE UserId = @CustomerUserId)
    BEGIN
        INSERT INTO [dbo].[Customers] (
            UserId,
            FullName,
            PhoneNumber,
            Email,
            DefaultAddress
        )
        VALUES (
            @CustomerUserId,
            'Maria Santos',
            '0917-555-0123',
            'customer2@example.com',
            '45 Mabini St, Quezon City, Metro Manila'
        );

        SET @CustomerId = SCOPE_IDENTITY();
        PRINT 'OK: Customer record created for customer2.';
        PRINT 'UserId: ' + CAST(@CustomerUserId AS NVARCHAR(10));
        PRINT 'CustomerId: ' + CAST(@CustomerId AS NVARCHAR(10));
    END
END
GO

-- =============================================
-- Rider Seed
-- =============================================
USE RiderServiceDB;
GO

DECLARE @RiderUserId INT;
SELECT @RiderUserId = UserId
FROM AuthServiceDB.[dbo].[Users]
WHERE Username = 'rider2' AND Role = 'Rider';

IF @RiderUserId IS NULL
BEGIN
    PRINT 'WARNING: rider2 user not found in AuthServiceDB after auth seed.';
    RETURN;
END

DECLARE @RiderId INT;

IF EXISTS (SELECT 1 FROM [dbo].[Riders] WHERE UserId = @RiderUserId)
BEGIN
    SELECT @RiderId = RiderId FROM [dbo].[Riders] WHERE UserId = @RiderUserId;
    PRINT 'OK: Rider record already exists for rider2.';
    PRINT 'UserId: ' + CAST(@RiderUserId AS NVARCHAR(10));
    PRINT 'RiderId: ' + CAST(@RiderId AS NVARCHAR(10));
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[Riders] WHERE UserId = @RiderUserId)
    BEGIN
        INSERT INTO [dbo].[Riders] (
            UserId,
            FullName,
            PhoneNumber,
            Email,
            VehicleType,
            VehicleNumber,
            LicenseNumber,
            IsActive
        )
        VALUES (
            @RiderUserId,
            'Paolo Reyes',
            '0918-444-0987',
            'rider2@restaurant.com',
            'Motorcycle',
            'XYZ-7821',
            'DL-77821',
            1
        );

        SET @RiderId = SCOPE_IDENTITY();
        PRINT 'OK: Rider record created for rider2.';
        PRINT 'UserId: ' + CAST(@RiderUserId AS NVARCHAR(10));
        PRINT 'RiderId: ' + CAST(@RiderId AS NVARCHAR(10));
    END
END

-- Ensure rider availability record exists (Available = online)
IF NOT EXISTS (SELECT 1 FROM [dbo].[RiderAvailability] WHERE RiderId = @RiderId)
BEGIN
    INSERT INTO [dbo].[RiderAvailability] (
        RiderId,
        IsOnline,
        LastSeen,
        UpdatedAt
    )
    VALUES (
        @RiderId,
        1,
        GETUTCDATE(),
        GETUTCDATE()
    );
    PRINT 'OK: Rider availability set to Online for rider2.';
END
ELSE
BEGIN
    PRINT 'OK: Rider availability record already exists for rider2.';
END
GO

-- =============================================
-- Order Seed
-- =============================================
USE OrderServiceDB;
GO

PRINT '';
PRINT '========================================';
PRINT 'Creating Test Order for customer2';
PRINT '========================================';
PRINT '';

DECLARE @OrderCustomerId INT;
SELECT @OrderCustomerId = CustomerId
FROM CustomerServiceDB.[dbo].[Customers]
WHERE UserId = (SELECT UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'customer2');

DECLARE @OrderRiderId INT;
SELECT @OrderRiderId = RiderId
FROM RiderServiceDB.[dbo].[Riders]
WHERE UserId = (SELECT UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'rider2');

IF @OrderCustomerId IS NULL
BEGIN
    PRINT 'WARNING: Customer record not found for customer2.';
    PRINT 'Please run the Customer Seed section first.';
    RETURN;
END

IF @OrderRiderId IS NULL
BEGIN
    PRINT 'WARNING: Rider record not found for rider2.';
    PRINT 'Please run the Rider Seed section first.';
END

DECLARE @OrderId INT;

IF NOT EXISTS (
    SELECT 1
    FROM [dbo].[Orders]
    WHERE CustomerId = @OrderCustomerId
      AND CustomerName = 'Maria Santos'
      AND DeliveryAddress = '45 Mabini St, Quezon City, Metro Manila'
      AND Status = 'Pending'
)
BEGIN
    INSERT INTO [dbo].[Orders] (
        CustomerId,
        CustomerName,
        CustomerPhone,
        DeliveryAddress,
        SpecialInstructions,
        OrderTotal,
        PaymentMethod,
        Status,
        OrderDate
    )
    VALUES (
        @OrderCustomerId,
        'Maria Santos',
        '0917-555-0123',
        '45 Mabini St, Quezon City, Metro Manila',
        'Leave with guard if not available. Call upon arrival.',
        32.50,
        'COD',
        'Pending',
        GETUTCDATE()
    );

    SET @OrderId = SCOPE_IDENTITY();
    PRINT 'OK: Test order created successfully.';
    PRINT 'OrderId: ' + CAST(@OrderId AS NVARCHAR(10));
END
ELSE
BEGIN
    SELECT @OrderId = OrderId
    FROM [dbo].[Orders]
    WHERE CustomerId = @OrderCustomerId
      AND CustomerName = 'Maria Santos'
      AND DeliveryAddress = '45 Mabini St, Quezon City, Metro Manila'
      AND Status = 'Pending';

    PRINT 'OK: Test order already exists.';
    PRINT 'OrderId: ' + CAST(@OrderId AS NVARCHAR(10));
END

PRINT '';
PRINT '========================================';
PRINT 'Seed Summary';
PRINT '========================================';
PRINT 'CustomerId: ' + CAST(@OrderCustomerId AS NVARCHAR(10));
PRINT 'RiderId: ' + CAST(@OrderRiderId AS NVARCHAR(10));
PRINT 'OrderId: ' + CAST(@OrderId AS NVARCHAR(10));
PRINT '========================================';
GO
