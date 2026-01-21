-- =============================================
-- Complete Idempotent Seed Script for React Testing
-- Fixes: 401 login errors, customerId: 0, empty orders
-- Safe to re-run (no destructive operations)
-- Password for all test users: password123
-- =============================================

-- =============================================
-- SECTION 1: AuthService User Seed
-- =============================================
USE AuthServiceDB;
GO

PRINT '';
PRINT '========================================';
PRINT 'SECTION 1: AuthService User Seed';
PRINT '========================================';

-- BCrypt hash for "password123" (validated hash)
DECLARE @PasswordHash NVARCHAR(255) = '$2a$11$4CYz5KtPgviORwjX6zbnkuLlOnNwPU7f4.jUP6NMIy.azxoLM122u';

-- Create customer2 auth user
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE Username = 'customer2')
BEGIN
    INSERT INTO [dbo].[Users] (Username, Email, PasswordHash, Role, IsActive)
    VALUES ('customer2', 'customer2@example.com', @PasswordHash, 'Customer', 1);
    PRINT 'OK: Auth user CREATED for customer2.';
END
ELSE
BEGIN
    -- Update password hash to ensure it's correct
    UPDATE [dbo].[Users] 
    SET PasswordHash = @PasswordHash, IsActive = 1
    WHERE Username = 'customer2';
    PRINT 'OK: Auth user EXISTS for customer2 (password hash updated).';
END

-- Create rider2 auth user
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE Username = 'rider2')
BEGIN
    INSERT INTO [dbo].[Users] (Username, Email, PasswordHash, Role, IsActive)
    VALUES ('rider2', 'rider2@restaurant.com', @PasswordHash, 'Rider', 1);
    PRINT 'OK: Auth user CREATED for rider2.';
END
ELSE
BEGIN
    -- Update password hash to ensure it's correct
    UPDATE [dbo].[Users] 
    SET PasswordHash = @PasswordHash, IsActive = 1
    WHERE Username = 'rider2';
    PRINT 'OK: Auth user EXISTS for rider2 (password hash updated).';
END

-- Print user IDs for verification
DECLARE @Customer2UserId INT, @Rider2UserId INT;
SELECT @Customer2UserId = UserId FROM [dbo].[Users] WHERE Username = 'customer2';
SELECT @Rider2UserId = UserId FROM [dbo].[Users] WHERE Username = 'rider2';
PRINT 'customer2 UserId: ' + CAST(ISNULL(@Customer2UserId, 0) AS NVARCHAR(10));
PRINT 'rider2 UserId: ' + CAST(ISNULL(@Rider2UserId, 0) AS NVARCHAR(10));
GO

-- =============================================
-- SECTION 2: Customer Seed (CustomerServiceDB)
-- =============================================
USE CustomerServiceDB;
GO

PRINT '';
PRINT '========================================';
PRINT 'SECTION 2: Customer Seed';
PRINT '========================================';

DECLARE @CustomerUserId INT;
SELECT @CustomerUserId = UserId
FROM AuthServiceDB.[dbo].[Users]
WHERE Username = 'customer2';

IF @CustomerUserId IS NULL
BEGIN
    PRINT 'ERROR: Auth user customer2 not found in AuthServiceDB. Cannot create customer.';
END
ELSE
BEGIN
    DECLARE @CustomerId INT;
    
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
            'Stephanie Niccole Calawod',
            '0917-555-0199',
            'customer2@example.com',
            '130 Adelfa St, Metro Heights, Quezon City'
        );

        SET @CustomerId = SCOPE_IDENTITY();
        PRINT 'OK: Customer record CREATED for customer2.';
    END
    ELSE
    BEGIN
        SELECT @CustomerId = CustomerId FROM [dbo].[Customers] WHERE UserId = @CustomerUserId;
        PRINT 'OK: Customer record EXISTS for customer2.';
    END
    
    PRINT 'customer2 UserId: ' + CAST(@CustomerUserId AS NVARCHAR(10));
    PRINT 'customer2 CustomerId: ' + CAST(ISNULL(@CustomerId, 0) AS NVARCHAR(10));
END
GO

-- =============================================
-- SECTION 3: Rider Seed (RiderServiceDB)
-- =============================================
USE RiderServiceDB;
GO

PRINT '';
PRINT '========================================';
PRINT 'SECTION 3: Rider Seed';
PRINT '========================================';

DECLARE @RiderUserId INT;
SELECT @RiderUserId = UserId
FROM AuthServiceDB.[dbo].[Users]
WHERE Username = 'rider2';

IF @RiderUserId IS NULL
BEGIN
    PRINT 'ERROR: Auth user rider2 not found in AuthServiceDB. Cannot create rider.';
END
ELSE
BEGIN
    DECLARE @RiderId INT;

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
        PRINT 'OK: Rider record CREATED for rider2.';
    END
    ELSE
    BEGIN
        SELECT @RiderId = RiderId FROM [dbo].[Riders] WHERE UserId = @RiderUserId;
        PRINT 'OK: Rider record EXISTS for rider2.';
    END
    
    PRINT 'rider2 UserId: ' + CAST(@RiderUserId AS NVARCHAR(10));
    PRINT 'rider2 RiderId: ' + CAST(ISNULL(@RiderId, 0) AS NVARCHAR(10));

    -- Ensure rider availability is online (Available)
    IF @RiderId IS NOT NULL
    BEGIN
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
            PRINT 'OK: Rider availability CREATED and set to Online for rider2.';
        END
        ELSE
        BEGIN
            UPDATE [dbo].[RiderAvailability]
            SET IsOnline = 1,
                LastSeen = GETUTCDATE(),
                UpdatedAt = GETUTCDATE()
            WHERE RiderId = @RiderId;
            PRINT 'OK: Rider availability EXISTS; marked Online for rider2.';
        END
    END
END
GO

-- =============================================
-- SECTION 4: Order Seed (OrderServiceDB)
-- =============================================
USE OrderServiceDB;
GO

PRINT '';
PRINT '========================================';
PRINT 'SECTION 4: Order Seed';
PRINT '========================================';

DECLARE @OrderCustomerId INT;
SELECT @OrderCustomerId = CustomerId
FROM CustomerServiceDB.[dbo].[Customers]
WHERE UserId = (SELECT UserId FROM AuthServiceDB.[dbo].[Users] WHERE Username = 'customer2');

IF @OrderCustomerId IS NULL
BEGIN
    PRINT 'ERROR: Customer record not found for customer2. Cannot create order.';
END
ELSE
BEGIN
    DECLARE @OrderId INT;
    
    -- Check if a pending order already exists for this customer
    IF NOT EXISTS (
        SELECT 1
        FROM [dbo].[Orders]
        WHERE CustomerId = @OrderCustomerId
          AND DeliveryAddress = '130 Adelfa St, Metro Heights, Quezon City'
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
            'Stephanie Niccole Calawod',
            '0917-555-0199',
            '130 Adelfa St, Metro Heights, Quezon City',
            'Leave at guard if not available.',
            249.75,
            'COD',
            'Pending',
            GETUTCDATE()
        );

        SET @OrderId = SCOPE_IDENTITY();
        PRINT 'OK: Test order CREATED for customer2.';
    END
    ELSE
    BEGIN
        SELECT @OrderId = OrderId
        FROM [dbo].[Orders]
        WHERE CustomerId = @OrderCustomerId
          AND DeliveryAddress = '130 Adelfa St, Metro Heights, Quezon City'
          AND Status = 'Pending';
        PRINT 'OK: Test order EXISTS for customer2.';
    END
    
    PRINT 'customer2 CustomerId: ' + CAST(@OrderCustomerId AS NVARCHAR(10));
    PRINT 'OrderId: ' + CAST(ISNULL(@OrderId, 0) AS NVARCHAR(10));
END
GO

-- =============================================
-- SECTION 5: Final Summary & Verification
-- =============================================
USE AuthServiceDB;
GO

PRINT '';
PRINT '========================================';
PRINT 'SEED COMPLETE - VERIFICATION SUMMARY';
PRINT '========================================';

-- Verify customer2
DECLARE @VerifyCustomer2UserId INT, @VerifyCustomer2Id INT, @VerifyCustomer2Orders INT;
SELECT @VerifyCustomer2UserId = UserId FROM [dbo].[Users] WHERE Username = 'customer2';
SELECT @VerifyCustomer2Id = CustomerId FROM CustomerServiceDB.[dbo].[Customers] WHERE UserId = @VerifyCustomer2UserId;
SELECT @VerifyCustomer2Orders = COUNT(*) FROM OrderServiceDB.[dbo].[Orders] WHERE CustomerId = @VerifyCustomer2Id;

PRINT '';
PRINT 'customer2:';
PRINT '  AuthServiceDB UserId: ' + CAST(ISNULL(@VerifyCustomer2UserId, 0) AS NVARCHAR(10));
PRINT '  CustomerServiceDB CustomerId: ' + CAST(ISNULL(@VerifyCustomer2Id, 0) AS NVARCHAR(10));
PRINT '  OrderServiceDB Orders Count: ' + CAST(ISNULL(@VerifyCustomer2Orders, 0) AS NVARCHAR(10));

-- Verify rider2
DECLARE @VerifyRider2UserId INT, @VerifyRider2Id INT, @VerifyRider2Online BIT;
SELECT @VerifyRider2UserId = UserId FROM [dbo].[Users] WHERE Username = 'rider2';
SELECT @VerifyRider2Id = RiderId FROM RiderServiceDB.[dbo].[Riders] WHERE UserId = @VerifyRider2UserId;
SELECT @VerifyRider2Online = IsOnline FROM RiderServiceDB.[dbo].[RiderAvailability] WHERE RiderId = @VerifyRider2Id;

PRINT '';
PRINT 'rider2:';
PRINT '  AuthServiceDB UserId: ' + CAST(ISNULL(@VerifyRider2UserId, 0) AS NVARCHAR(10));
PRINT '  RiderServiceDB RiderId: ' + CAST(ISNULL(@VerifyRider2Id, 0) AS NVARCHAR(10));
PRINT '  IsOnline: ' + CAST(ISNULL(@VerifyRider2Online, 0) AS NVARCHAR(5));

PRINT '';
PRINT '========================================';
PRINT 'TEST CREDENTIALS';
PRINT '========================================';
PRINT 'Username: customer2, Password: password123, Role: Customer';
PRINT 'Username: rider2, Password: password123, Role: Rider';
PRINT '========================================';
PRINT '';
PRINT 'If all IDs above are non-zero, the seed was successful.';
PRINT 'You can now login as customer2 and see orders in the React app.';
GO
