-- =============================================
-- Stored Procedures for Database-First Architecture
-- Single Source of Truth: All business logic, validation, and state decisions
-- Run this AFTER 00_SetupAllDatabases.sql
-- =============================================

-- =============================================
-- AUTHENTICATION SERVICE STORED PROCEDURES (AuthServiceDB)
-- =============================================
USE AuthServiceDB;
GO

-- Drop existing procedures if they exist
IF OBJECT_ID('dbo.sp_Auth_Login', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Auth_Login;
IF OBJECT_ID('dbo.sp_Auth_GetUserById', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Auth_GetUserById;
IF OBJECT_ID('dbo.sp_Auth_GetUserByUsername', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Auth_GetUserByUsername;
IF OBJECT_ID('dbo.sp_Auth_CreateUser', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Auth_CreateUser;
IF OBJECT_ID('dbo.sp_Auth_SaveRefreshToken', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Auth_SaveRefreshToken;
IF OBJECT_ID('dbo.sp_Auth_GetRefreshToken', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Auth_GetRefreshToken;
IF OBJECT_ID('dbo.sp_Auth_RevokeRefreshToken', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Auth_RevokeRefreshToken;
GO

-- =============================================
-- sp_Auth_Login: Authenticate user by username/email
-- Returns: User data if credentials valid, NULL if invalid
-- Business Rules:
--   - User must exist
--   - User must be active (IsActive = 1)
--   - Returns password hash for verification in application layer (BCrypt)
-- =============================================
CREATE PROCEDURE dbo.sp_Auth_Login
    @Identifier NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Return user if found by username OR email, and is active
    SELECT 
        UserId,
        Username,
        Email,
        PasswordHash,
        Role,
        IsActive,
        CreatedAt,
        UpdatedAt
    FROM dbo.Users
    WHERE (Username = @Identifier OR Email = @Identifier)
      AND IsActive = 1;
END
GO

-- =============================================
-- sp_Auth_GetUserById: Get user by ID
-- =============================================
CREATE PROCEDURE dbo.sp_Auth_GetUserById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserId,
        Username,
        Email,
        PasswordHash,
        Role,
        IsActive,
        CreatedAt,
        UpdatedAt
    FROM dbo.Users
    WHERE UserId = @UserId;
END
GO

-- =============================================
-- sp_Auth_GetUserByUsername: Get user by username
-- =============================================
CREATE PROCEDURE dbo.sp_Auth_GetUserByUsername
    @Username NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserId,
        Username,
        Email,
        PasswordHash,
        Role,
        IsActive,
        CreatedAt,
        UpdatedAt
    FROM dbo.Users
    WHERE Username = @Username;
END
GO

-- =============================================
-- sp_Auth_CreateUser: Create new user
-- Business Rules:
--   - Username must be unique
--   - Email must be unique
--   - Role must be valid (Customer, Rider, Admin)
-- Returns: New user data with generated UserId, or error
-- =============================================
CREATE PROCEDURE dbo.sp_Auth_CreateUser
    @Username NVARCHAR(100),
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(500),
    @Role NVARCHAR(50),
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate role
    IF @Role NOT IN ('Customer', 'Rider', 'Admin')
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Invalid role. Must be Customer, Rider, or Admin.';
        RETURN;
    END
    
    -- Check username uniqueness
    IF EXISTS (SELECT 1 FROM dbo.Users WHERE Username = @Username)
    BEGIN
        SET @ResultCode = -2;
        SET @ResultMessage = 'Username already exists.';
        RETURN;
    END
    
    -- Check email uniqueness
    IF EXISTS (SELECT 1 FROM dbo.Users WHERE Email = @Email)
    BEGIN
        SET @ResultCode = -3;
        SET @ResultMessage = 'Email already exists.';
        RETURN;
    END
    
    -- Insert user
    DECLARE @Now DATETIME2 = GETUTCDATE();
    
    INSERT INTO dbo.Users (Username, Email, PasswordHash, Role, IsActive, CreatedAt, UpdatedAt)
    VALUES (@Username, @Email, @PasswordHash, @Role, 1, @Now, @Now);
    
    DECLARE @NewUserId INT = SCOPE_IDENTITY();
    
    SET @ResultCode = 0;
    SET @ResultMessage = 'User created successfully.';
    
    -- Return created user
    SELECT 
        UserId,
        Username,
        Email,
        PasswordHash,
        Role,
        IsActive,
        CreatedAt,
        UpdatedAt
    FROM dbo.Users
    WHERE UserId = @NewUserId;
END
GO

-- =============================================
-- sp_Auth_SaveRefreshToken: Save refresh token for user
-- =============================================
CREATE PROCEDURE dbo.sp_Auth_SaveRefreshToken
    @UserId INT,
    @Token NVARCHAR(500),
    @ExpiresAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.RefreshTokens (UserId, Token, ExpiresAt, CreatedAt)
    VALUES (@UserId, @Token, @ExpiresAt, GETUTCDATE());
    
    SELECT SCOPE_IDENTITY() AS TokenId;
END
GO

-- =============================================
-- sp_Auth_GetRefreshToken: Validate refresh token
-- Returns token if valid and not expired
-- =============================================
CREATE PROCEDURE dbo.sp_Auth_GetRefreshToken
    @Token NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        rt.TokenId,
        rt.UserId,
        rt.Token,
        rt.ExpiresAt,
        rt.CreatedAt,
        u.Username,
        u.Email,
        u.Role,
        u.IsActive
    FROM dbo.RefreshTokens rt
    INNER JOIN dbo.Users u ON rt.UserId = u.UserId
    WHERE rt.Token = @Token
      AND rt.ExpiresAt > GETUTCDATE()
      AND u.IsActive = 1;
END
GO

-- =============================================
-- sp_Auth_RevokeRefreshToken: Delete refresh token
-- =============================================
CREATE PROCEDURE dbo.sp_Auth_RevokeRefreshToken
    @Token NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM dbo.RefreshTokens WHERE Token = @Token;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

PRINT '✓ AuthServiceDB: Stored procedures created';
GO

-- =============================================
-- ORDER SERVICE STORED PROCEDURES (OrderServiceDB)
-- =============================================
USE OrderServiceDB;
GO

-- Drop existing procedures
IF OBJECT_ID('dbo.sp_Order_Create', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Order_Create;
IF OBJECT_ID('dbo.sp_Order_GetById', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Order_GetById;
IF OBJECT_ID('dbo.sp_Order_GetAll', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Order_GetAll;
IF OBJECT_ID('dbo.sp_Order_GetByCustomerId', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Order_GetByCustomerId;
IF OBJECT_ID('dbo.sp_Order_GetPending', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Order_GetPending;
IF OBJECT_ID('dbo.sp_Order_UpdateStatus', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Order_UpdateStatus;
GO

-- =============================================
-- sp_Order_Create: Create new order
-- Business Rules:
--   - CustomerId must be provided
--   - OrderTotal must be > 0
--   - Initial Status = 'Pending' (enforced by database)
-- =============================================
CREATE PROCEDURE dbo.sp_Order_Create
    @CustomerId INT,
    @CustomerName NVARCHAR(255),
    @CustomerPhone NVARCHAR(50),
    @DeliveryAddress NVARCHAR(500),
    @SpecialInstructions NVARCHAR(1000) = NULL,
    @OrderTotal DECIMAL(18,2),
    @PaymentMethod NVARCHAR(50),
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate OrderTotal
    IF @OrderTotal <= 0
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Order total must be greater than zero.';
        RETURN;
    END
    
    -- Validate required fields
    IF @CustomerName IS NULL OR LEN(TRIM(@CustomerName)) = 0
    BEGIN
        SET @ResultCode = -2;
        SET @ResultMessage = 'Customer name is required.';
        RETURN;
    END
    
    IF @DeliveryAddress IS NULL OR LEN(TRIM(@DeliveryAddress)) = 0
    BEGIN
        SET @ResultCode = -3;
        SET @ResultMessage = 'Delivery address is required.';
        RETURN;
    END
    
    DECLARE @Now DATETIME2 = GETUTCDATE();
    
    INSERT INTO dbo.Orders (
        CustomerId, CustomerName, CustomerPhone, DeliveryAddress,
        SpecialInstructions, OrderTotal, PaymentMethod,
        Status, OrderDate, CreatedAt, UpdatedAt
    )
    VALUES (
        @CustomerId, @CustomerName, @CustomerPhone, @DeliveryAddress,
        @SpecialInstructions, @OrderTotal, @PaymentMethod,
        'Pending', @Now, @Now, @Now
    );
    
    DECLARE @NewOrderId INT = SCOPE_IDENTITY();
    
    SET @ResultCode = 0;
    SET @ResultMessage = 'Order created successfully.';
    
    -- Return created order
    SELECT 
        OrderId,
        CustomerId,
        CustomerName,
        CustomerPhone,
        DeliveryAddress,
        SpecialInstructions,
        OrderTotal,
        PaymentMethod,
        Status,
        OrderDate,
        CreatedAt,
        UpdatedAt
    FROM dbo.Orders
    WHERE OrderId = @NewOrderId;
END
GO

-- =============================================
-- sp_Order_GetById: Get order by ID
-- =============================================
CREATE PROCEDURE dbo.sp_Order_GetById
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        OrderId,
        CustomerId,
        CustomerName,
        CustomerPhone,
        DeliveryAddress,
        SpecialInstructions,
        OrderTotal,
        PaymentMethod,
        Status,
        OrderDate,
        CreatedAt,
        UpdatedAt
    FROM dbo.Orders
    WHERE OrderId = @OrderId;
END
GO

-- =============================================
-- sp_Order_GetAll: Get all orders (newest first)
-- =============================================
CREATE PROCEDURE dbo.sp_Order_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        OrderId,
        CustomerId,
        CustomerName,
        CustomerPhone,
        DeliveryAddress,
        SpecialInstructions,
        OrderTotal,
        PaymentMethod,
        Status,
        OrderDate,
        CreatedAt,
        UpdatedAt
    FROM dbo.Orders
    ORDER BY OrderDate DESC;
END
GO

-- =============================================
-- sp_Order_GetByCustomerId: Get orders for a customer
-- =============================================
CREATE PROCEDURE dbo.sp_Order_GetByCustomerId
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        OrderId,
        CustomerId,
        CustomerName,
        CustomerPhone,
        DeliveryAddress,
        SpecialInstructions,
        OrderTotal,
        PaymentMethod,
        Status,
        OrderDate,
        CreatedAt,
        UpdatedAt
    FROM dbo.Orders
    WHERE CustomerId = @CustomerId
    ORDER BY OrderDate DESC;
END
GO

-- =============================================
-- sp_Order_GetPending: Get pending orders for assignment
-- Business Rule: Orders with Status = 'Pending' need rider assignment
-- =============================================
CREATE PROCEDURE dbo.sp_Order_GetPending
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        OrderId,
        CustomerId,
        CustomerName,
        CustomerPhone,
        DeliveryAddress,
        SpecialInstructions,
        OrderTotal,
        PaymentMethod,
        Status,
        OrderDate,
        CreatedAt,
        UpdatedAt
    FROM dbo.Orders
    WHERE Status = 'Pending'
    ORDER BY OrderDate ASC; -- FIFO: oldest first
END
GO

-- =============================================
-- sp_Order_UpdateStatus: Update order status
-- Business Rules:
--   - Valid transitions enforced by database
--   - Pending -> Confirmed -> Preparing -> Ready -> Assigned -> Delivered/Cancelled
-- =============================================
CREATE PROCEDURE dbo.sp_Order_UpdateStatus
    @OrderId INT,
    @NewStatus NVARCHAR(50),
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentStatus NVARCHAR(50);
    
    SELECT @CurrentStatus = Status FROM dbo.Orders WHERE OrderId = @OrderId;
    
    IF @CurrentStatus IS NULL
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Order not found.';
        RETURN;
    END
    
    -- Validate status transition (business rule from database)
    DECLARE @ValidTransition BIT = 0;
    
    IF @CurrentStatus = 'Pending' AND @NewStatus IN ('Confirmed', 'Assigned', 'Cancelled')
        SET @ValidTransition = 1;
    ELSE IF @CurrentStatus = 'Confirmed' AND @NewStatus IN ('Preparing', 'Assigned', 'Cancelled')
        SET @ValidTransition = 1;
    ELSE IF @CurrentStatus = 'Preparing' AND @NewStatus IN ('Ready', 'Cancelled')
        SET @ValidTransition = 1;
    ELSE IF @CurrentStatus = 'Ready' AND @NewStatus IN ('Assigned', 'Cancelled')
        SET @ValidTransition = 1;
    ELSE IF @CurrentStatus = 'Assigned' AND @NewStatus IN ('PickedUp', 'Delivered', 'Cancelled')
        SET @ValidTransition = 1;
    ELSE IF @CurrentStatus = 'PickedUp' AND @NewStatus IN ('Delivered', 'Cancelled')
        SET @ValidTransition = 1;
    
    IF @ValidTransition = 0
    BEGIN
        SET @ResultCode = -2;
        SET @ResultMessage = 'Invalid status transition from ' + @CurrentStatus + ' to ' + @NewStatus;
        RETURN;
    END
    
    UPDATE dbo.Orders
    SET Status = @NewStatus, UpdatedAt = GETUTCDATE()
    WHERE OrderId = @OrderId;
    
    SET @ResultCode = 0;
    SET @ResultMessage = 'Status updated successfully.';
    
    -- Return updated order
    SELECT 
        OrderId,
        CustomerId,
        CustomerName,
        CustomerPhone,
        DeliveryAddress,
        SpecialInstructions,
        OrderTotal,
        PaymentMethod,
        Status,
        OrderDate,
        CreatedAt,
        UpdatedAt
    FROM dbo.Orders
    WHERE OrderId = @OrderId;
END
GO

PRINT '✓ OrderServiceDB: Stored procedures created';
GO

-- =============================================
-- DELIVERY SERVICE STORED PROCEDURES (DeliveryServiceDB)
-- =============================================
USE DeliveryServiceDB;
GO

-- Drop existing procedures
IF OBJECT_ID('dbo.sp_Delivery_Create', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Delivery_Create;
IF OBJECT_ID('dbo.sp_Delivery_GetById', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Delivery_GetById;
IF OBJECT_ID('dbo.sp_Delivery_GetByOrderId', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Delivery_GetByOrderId;
IF OBJECT_ID('dbo.sp_Delivery_GetByRiderId', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Delivery_GetByRiderId;
IF OBJECT_ID('dbo.sp_Delivery_AssignRider', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Delivery_AssignRider;
IF OBJECT_ID('dbo.sp_Delivery_UpdateStatus', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Delivery_UpdateStatus;
IF OBJECT_ID('dbo.sp_Delivery_GetAll', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Delivery_GetAll;
IF OBJECT_ID('dbo.sp_Delivery_GetActiveByRiderId', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Delivery_GetActiveByRiderId;
IF OBJECT_ID('dbo.sp_Delivery_AddTracking', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Delivery_AddTracking;
GO

-- =============================================
-- sp_Delivery_Create: Create delivery for order
-- =============================================
CREATE PROCEDURE dbo.sp_Delivery_Create
    @OrderId INT,
    @RiderId INT = NULL,
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if delivery already exists for this order
    IF EXISTS (SELECT 1 FROM dbo.Deliveries WHERE OrderId = @OrderId)
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Delivery already exists for this order.';
        -- Return existing delivery
        SELECT * FROM dbo.Deliveries WHERE OrderId = @OrderId;
        RETURN;
    END
    
    DECLARE @Now DATETIME2 = GETUTCDATE();
    DECLARE @Status NVARCHAR(50) = CASE WHEN @RiderId IS NOT NULL THEN 'Assigned' ELSE 'Pending' END;
    
    INSERT INTO dbo.Deliveries (OrderId, RiderId, Status, AssignedAt, CreatedAt, UpdatedAt)
    VALUES (@OrderId, @RiderId, @Status, 
            CASE WHEN @RiderId IS NOT NULL THEN @Now ELSE NULL END,
            @Now, @Now);
    
    DECLARE @NewDeliveryId INT = SCOPE_IDENTITY();
    
    SET @ResultCode = 0;
    SET @ResultMessage = 'Delivery created successfully.';
    
    SELECT 
        DeliveryId, OrderId, RiderId, Status,
        AssignedAt, PickedUpAt, DeliveredAt, FailedAt, FailureReason,
        CreatedAt, UpdatedAt
    FROM dbo.Deliveries
    WHERE DeliveryId = @NewDeliveryId;
END
GO

-- =============================================
-- sp_Delivery_GetById: Get delivery by ID
-- =============================================
CREATE PROCEDURE dbo.sp_Delivery_GetById
    @DeliveryId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        DeliveryId, OrderId, RiderId, Status,
        AssignedAt, PickedUpAt, DeliveredAt, FailedAt, FailureReason,
        CreatedAt, UpdatedAt
    FROM dbo.Deliveries
    WHERE DeliveryId = @DeliveryId;
END
GO

-- =============================================
-- sp_Delivery_GetByOrderId: Get delivery by Order ID
-- =============================================
CREATE PROCEDURE dbo.sp_Delivery_GetByOrderId
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        DeliveryId, OrderId, RiderId, Status,
        AssignedAt, PickedUpAt, DeliveredAt, FailedAt, FailureReason,
        CreatedAt, UpdatedAt
    FROM dbo.Deliveries
    WHERE OrderId = @OrderId;
END
GO

-- =============================================
-- sp_Delivery_GetByRiderId: Get deliveries for a rider
-- =============================================
CREATE PROCEDURE dbo.sp_Delivery_GetByRiderId
    @RiderId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        DeliveryId, OrderId, RiderId, Status,
        AssignedAt, PickedUpAt, DeliveredAt, FailedAt, FailureReason,
        CreatedAt, UpdatedAt
    FROM dbo.Deliveries
    WHERE RiderId = @RiderId
    ORDER BY CreatedAt DESC;
END
GO

-- =============================================
-- sp_Delivery_GetActiveByRiderId: Get active deliveries for rider
-- Active = Not yet delivered or failed
-- =============================================
CREATE PROCEDURE dbo.sp_Delivery_GetActiveByRiderId
    @RiderId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        DeliveryId, OrderId, RiderId, Status,
        AssignedAt, PickedUpAt, DeliveredAt, FailedAt, FailureReason,
        CreatedAt, UpdatedAt
    FROM dbo.Deliveries
    WHERE RiderId = @RiderId
      AND Status IN ('Assigned', 'Accepted', 'PickedUp', 'InTransit')
    ORDER BY AssignedAt ASC;
END
GO

-- =============================================
-- sp_Delivery_AssignRider: Assign rider to delivery
-- Business Rules:
--   - Delivery must exist and be in Pending status
--   - Rider must be available (checked externally)
-- =============================================
CREATE PROCEDURE dbo.sp_Delivery_AssignRider
    @DeliveryId INT,
    @RiderId INT,
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentStatus NVARCHAR(50);
    DECLARE @CurrentRiderId INT;
    
    SELECT @CurrentStatus = Status, @CurrentRiderId = RiderId
    FROM dbo.Deliveries
    WHERE DeliveryId = @DeliveryId;
    
    IF @CurrentStatus IS NULL
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Delivery not found.';
        RETURN;
    END
    
    IF @CurrentRiderId IS NOT NULL
    BEGIN
        SET @ResultCode = -2;
        SET @ResultMessage = 'Delivery already has a rider assigned.';
        RETURN;
    END
    
    IF @CurrentStatus NOT IN ('Pending')
    BEGIN
        SET @ResultCode = -3;
        SET @ResultMessage = 'Cannot assign rider. Delivery status is ' + @CurrentStatus;
        RETURN;
    END
    
    UPDATE dbo.Deliveries
    SET RiderId = @RiderId,
        Status = 'Assigned',
        AssignedAt = GETUTCDATE(),
        UpdatedAt = GETUTCDATE()
    WHERE DeliveryId = @DeliveryId;
    
    SET @ResultCode = 0;
    SET @ResultMessage = 'Rider assigned successfully.';
    
    SELECT 
        DeliveryId, OrderId, RiderId, Status,
        AssignedAt, PickedUpAt, DeliveredAt, FailedAt, FailureReason,
        CreatedAt, UpdatedAt
    FROM dbo.Deliveries
    WHERE DeliveryId = @DeliveryId;
END
GO

-- =============================================
-- sp_Delivery_UpdateStatus: Update delivery status
-- Business Rules (state machine enforced by DB):
--   Pending -> Assigned (rider assigned)
--   Assigned -> Accepted (rider accepts)
--   Accepted -> PickedUp (rider picked up)
--   PickedUp -> InTransit (on the way)
--   InTransit -> Delivered (completed)
--   Any -> Failed (with reason)
-- =============================================
CREATE PROCEDURE dbo.sp_Delivery_UpdateStatus
    @DeliveryId INT,
    @NewStatus NVARCHAR(50),
    @FailureReason NVARCHAR(500) = NULL,
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentStatus NVARCHAR(50);
    
    SELECT @CurrentStatus = Status FROM dbo.Deliveries WHERE DeliveryId = @DeliveryId;
    
    IF @CurrentStatus IS NULL
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Delivery not found.';
        RETURN;
    END
    
    -- Validate status transition
    DECLARE @ValidTransition BIT = 0;
    
    IF @NewStatus = 'Failed'
        SET @ValidTransition = 1; -- Can fail from any status
    ELSE IF @CurrentStatus = 'Pending' AND @NewStatus = 'Assigned'
        SET @ValidTransition = 1;
    ELSE IF @CurrentStatus = 'Assigned' AND @NewStatus = 'Accepted'
        SET @ValidTransition = 1;
    ELSE IF @CurrentStatus = 'Accepted' AND @NewStatus = 'PickedUp'
        SET @ValidTransition = 1;
    ELSE IF @CurrentStatus = 'PickedUp' AND @NewStatus IN ('InTransit', 'Delivered')
        SET @ValidTransition = 1;
    ELSE IF @CurrentStatus = 'InTransit' AND @NewStatus = 'Delivered'
        SET @ValidTransition = 1;
    
    IF @ValidTransition = 0
    BEGIN
        SET @ResultCode = -2;
        SET @ResultMessage = 'Invalid status transition from ' + @CurrentStatus + ' to ' + @NewStatus;
        RETURN;
    END
    
    -- Update with appropriate timestamp
    UPDATE dbo.Deliveries
    SET Status = @NewStatus,
        PickedUpAt = CASE WHEN @NewStatus = 'PickedUp' THEN GETUTCDATE() ELSE PickedUpAt END,
        DeliveredAt = CASE WHEN @NewStatus = 'Delivered' THEN GETUTCDATE() ELSE DeliveredAt END,
        FailedAt = CASE WHEN @NewStatus = 'Failed' THEN GETUTCDATE() ELSE FailedAt END,
        FailureReason = CASE WHEN @NewStatus = 'Failed' THEN @FailureReason ELSE FailureReason END,
        UpdatedAt = GETUTCDATE()
    WHERE DeliveryId = @DeliveryId;
    
    SET @ResultCode = 0;
    SET @ResultMessage = 'Status updated successfully.';
    
    SELECT 
        DeliveryId, OrderId, RiderId, Status,
        AssignedAt, PickedUpAt, DeliveredAt, FailedAt, FailureReason,
        CreatedAt, UpdatedAt
    FROM dbo.Deliveries
    WHERE DeliveryId = @DeliveryId;
END
GO

-- =============================================
-- sp_Delivery_GetAll: Get all deliveries
-- =============================================
CREATE PROCEDURE dbo.sp_Delivery_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        DeliveryId, OrderId, RiderId, Status,
        AssignedAt, PickedUpAt, DeliveredAt, FailedAt, FailureReason,
        CreatedAt, UpdatedAt
    FROM dbo.Deliveries
    ORDER BY CreatedAt DESC;
END
GO

-- =============================================
-- sp_Delivery_AddTracking: Add tracking entry
-- =============================================
CREATE PROCEDURE dbo.sp_Delivery_AddTracking
    @DeliveryId INT,
    @Status NVARCHAR(50),
    @Latitude DECIMAL(9,6) = NULL,
    @Longitude DECIMAL(9,6) = NULL,
    @Notes NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.DeliveryTracking (DeliveryId, Status, LocationLatitude, LocationLongitude, Notes, Timestamp)
    VALUES (@DeliveryId, @Status, @Latitude, @Longitude, @Notes, GETUTCDATE());
    
    SELECT SCOPE_IDENTITY() AS TrackingId;
END
GO

PRINT '✓ DeliveryServiceDB: Stored procedures created';
GO

-- =============================================
-- RIDER SERVICE STORED PROCEDURES (RiderServiceDB)
-- =============================================
USE RiderServiceDB;
GO

-- Drop existing procedures
IF OBJECT_ID('dbo.sp_Rider_Create', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_Create;
IF OBJECT_ID('dbo.sp_Rider_GetById', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_GetById;
IF OBJECT_ID('dbo.sp_Rider_GetByUserId', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_GetByUserId;
IF OBJECT_ID('dbo.sp_Rider_GetAll', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_GetAll;
IF OBJECT_ID('dbo.sp_Rider_GetOnline', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_GetOnline;
IF OBJECT_ID('dbo.sp_Rider_SetOnlineStatus', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_SetOnlineStatus;
IF OBJECT_ID('dbo.sp_Rider_UpdateLocation', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_UpdateLocation;
IF OBJECT_ID('dbo.sp_Rider_GetAvailability', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_GetAvailability;
IF OBJECT_ID('dbo.sp_Rider_AddEarning', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_AddEarning;
IF OBJECT_ID('dbo.sp_Rider_GetEarnings', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_GetEarnings;
IF OBJECT_ID('dbo.sp_Rider_AddFeedback', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_AddFeedback;
IF OBJECT_ID('dbo.sp_Rider_GetFeedback', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Rider_GetFeedback;
GO

-- =============================================
-- sp_Rider_Create: Create rider profile
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_Create
    @UserId INT,
    @FullName NVARCHAR(255),
    @PhoneNumber NVARCHAR(50),
    @Email NVARCHAR(255) = NULL,
    @VehicleType NVARCHAR(50) = NULL,
    @VehicleNumber NVARCHAR(50) = NULL,
    @LicenseNumber NVARCHAR(100) = NULL,
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if rider already exists for this user
    IF EXISTS (SELECT 1 FROM dbo.Riders WHERE UserId = @UserId)
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Rider profile already exists for this user.';
        SELECT * FROM dbo.Riders WHERE UserId = @UserId;
        RETURN;
    END
    
    DECLARE @Now DATETIME2 = GETUTCDATE();
    
    INSERT INTO dbo.Riders (UserId, FullName, PhoneNumber, Email, VehicleType, VehicleNumber, LicenseNumber, IsActive, CreatedAt, UpdatedAt)
    VALUES (@UserId, @FullName, @PhoneNumber, @Email, @VehicleType, @VehicleNumber, @LicenseNumber, 1, @Now, @Now);
    
    DECLARE @NewRiderId INT = SCOPE_IDENTITY();
    
    -- Create initial availability record (offline by default)
    INSERT INTO dbo.RiderAvailability (RiderId, IsOnline, LastSeen, UpdatedAt)
    VALUES (@NewRiderId, 0, @Now, @Now);
    
    SET @ResultCode = 0;
    SET @ResultMessage = 'Rider created successfully.';
    
    SELECT * FROM dbo.Riders WHERE RiderId = @NewRiderId;
END
GO

-- =============================================
-- sp_Rider_GetById: Get rider by ID
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_GetById
    @RiderId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        RiderId, UserId, FullName, PhoneNumber, Email,
        VehicleType, VehicleNumber, LicenseNumber,
        IsActive, CreatedAt, UpdatedAt
    FROM dbo.Riders
    WHERE RiderId = @RiderId;
END
GO

-- =============================================
-- sp_Rider_GetByUserId: Get rider by User ID
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_GetByUserId
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        RiderId, UserId, FullName, PhoneNumber, Email,
        VehicleType, VehicleNumber, LicenseNumber,
        IsActive, CreatedAt, UpdatedAt
    FROM dbo.Riders
    WHERE UserId = @UserId;
END
GO

-- =============================================
-- sp_Rider_GetAll: Get all riders
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.RiderId, r.UserId, r.FullName, r.PhoneNumber, r.Email,
        r.VehicleType, r.VehicleNumber, r.LicenseNumber,
        r.IsActive, r.CreatedAt, r.UpdatedAt,
        ra.IsOnline, ra.CurrentLatitude, ra.CurrentLongitude, ra.LastSeen
    FROM dbo.Riders r
    LEFT JOIN dbo.RiderAvailability ra ON r.RiderId = ra.RiderId
    ORDER BY r.CreatedAt DESC;
END
GO

-- =============================================
-- sp_Rider_GetOnline: Get all online riders
-- Used for order assignment load balancing
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_GetOnline
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.RiderId, r.UserId, r.FullName, r.PhoneNumber, r.Email,
        r.VehicleType, r.VehicleNumber, r.LicenseNumber,
        r.IsActive, r.CreatedAt, r.UpdatedAt,
        ra.IsOnline, ra.CurrentLatitude, ra.CurrentLongitude, ra.LastSeen
    FROM dbo.Riders r
    INNER JOIN dbo.RiderAvailability ra ON r.RiderId = ra.RiderId
    WHERE r.IsActive = 1 AND ra.IsOnline = 1
    ORDER BY ra.LastSeen DESC;
END
GO

-- =============================================
-- sp_Rider_SetOnlineStatus: Set rider online/offline
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_SetOnlineStatus
    @RiderId INT,
    @IsOnline BIT,
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM dbo.Riders WHERE RiderId = @RiderId)
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Rider not found.';
        RETURN;
    END
    
    DECLARE @Now DATETIME2 = GETUTCDATE();
    
    -- Update or insert availability
    IF EXISTS (SELECT 1 FROM dbo.RiderAvailability WHERE RiderId = @RiderId)
    BEGIN
        UPDATE dbo.RiderAvailability
        SET IsOnline = @IsOnline, LastSeen = @Now, UpdatedAt = @Now
        WHERE RiderId = @RiderId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.RiderAvailability (RiderId, IsOnline, LastSeen, UpdatedAt)
        VALUES (@RiderId, @IsOnline, @Now, @Now);
    END
    
    SET @ResultCode = 0;
    SET @ResultMessage = CASE WHEN @IsOnline = 1 THEN 'Rider is now online.' ELSE 'Rider is now offline.' END;
    
    SELECT 
        ra.AvailabilityId, ra.RiderId, ra.IsOnline,
        ra.CurrentLatitude, ra.CurrentLongitude, ra.LastSeen, ra.UpdatedAt
    FROM dbo.RiderAvailability ra
    WHERE ra.RiderId = @RiderId;
END
GO

-- =============================================
-- sp_Rider_UpdateLocation: Update rider location
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_UpdateLocation
    @RiderId INT,
    @Latitude DECIMAL(10,8),
    @Longitude DECIMAL(11,8)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Now DATETIME2 = GETUTCDATE();
    
    UPDATE dbo.RiderAvailability
    SET CurrentLatitude = @Latitude,
        CurrentLongitude = @Longitude,
        LastSeen = @Now,
        UpdatedAt = @Now
    WHERE RiderId = @RiderId;
    
    IF @@ROWCOUNT = 0
    BEGIN
        INSERT INTO dbo.RiderAvailability (RiderId, IsOnline, CurrentLatitude, CurrentLongitude, LastSeen, UpdatedAt)
        VALUES (@RiderId, 1, @Latitude, @Longitude, @Now, @Now);
    END
    
    SELECT 
        AvailabilityId, RiderId, IsOnline,
        CurrentLatitude, CurrentLongitude, LastSeen, UpdatedAt
    FROM dbo.RiderAvailability
    WHERE RiderId = @RiderId;
END
GO

-- =============================================
-- sp_Rider_GetAvailability: Get rider availability
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_GetAvailability
    @RiderId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        AvailabilityId, RiderId, IsOnline,
        CurrentLatitude, CurrentLongitude, LastSeen, UpdatedAt
    FROM dbo.RiderAvailability
    WHERE RiderId = @RiderId;
END
GO

-- =============================================
-- sp_Rider_AddEarning: Record rider earning
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_AddEarning
    @RiderId INT,
    @DeliveryId INT,
    @OrderId INT,
    @Amount DECIMAL(10,2),
    @CommissionRate DECIMAL(5,2) = 10.00
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.RiderEarnings (RiderId, DeliveryId, OrderId, Amount, CommissionRate, Status, EarningDate, CreatedAt)
    VALUES (@RiderId, @DeliveryId, @OrderId, @Amount, @CommissionRate, 'Pending', GETUTCDATE(), GETUTCDATE());
    
    SELECT SCOPE_IDENTITY() AS EarningId;
END
GO

-- =============================================
-- sp_Rider_GetEarnings: Get rider earnings
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_GetEarnings
    @RiderId INT,
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        EarningId, RiderId, DeliveryId, OrderId,
        Amount, CommissionRate, Status, EarningDate, CreatedAt
    FROM dbo.RiderEarnings
    WHERE RiderId = @RiderId
      AND (@StartDate IS NULL OR EarningDate >= @StartDate)
      AND (@EndDate IS NULL OR EarningDate <= @EndDate)
    ORDER BY EarningDate DESC;
END
GO

-- =============================================
-- sp_Rider_AddFeedback: Add feedback for rider
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_AddFeedback
    @RiderId INT,
    @DeliveryId INT,
    @OrderId INT,
    @Rating INT,
    @Comment NVARCHAR(1000) = NULL,
    @CustomerId INT = NULL,
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Rating < 1 OR @Rating > 5
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Rating must be between 1 and 5.';
        RETURN;
    END
    
    INSERT INTO dbo.RiderFeedback (RiderId, DeliveryId, OrderId, Rating, Comment, CustomerId, CreatedAt)
    VALUES (@RiderId, @DeliveryId, @OrderId, @Rating, @Comment, @CustomerId, GETUTCDATE());
    
    SET @ResultCode = 0;
    SET @ResultMessage = 'Feedback submitted successfully.';
    
    SELECT SCOPE_IDENTITY() AS FeedbackId;
END
GO

-- =============================================
-- sp_Rider_GetFeedback: Get rider feedback
-- =============================================
CREATE PROCEDURE dbo.sp_Rider_GetFeedback
    @RiderId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        FeedbackId, RiderId, DeliveryId, OrderId,
        Rating, Comment, CustomerId, CreatedAt
    FROM dbo.RiderFeedback
    WHERE RiderId = @RiderId
    ORDER BY CreatedAt DESC;
    
    -- Also return average rating
    SELECT 
        COUNT(*) AS TotalReviews,
        AVG(CAST(Rating AS DECIMAL(3,2))) AS AverageRating
    FROM dbo.RiderFeedback
    WHERE RiderId = @RiderId;
END
GO

PRINT '✓ RiderServiceDB: Stored procedures created';
GO

-- =============================================
-- CUSTOMER SERVICE STORED PROCEDURES (CustomerServiceDB)
-- =============================================
USE CustomerServiceDB;
GO

-- Drop existing procedures
IF OBJECT_ID('dbo.sp_Customer_Create', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Customer_Create;
IF OBJECT_ID('dbo.sp_Customer_GetById', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Customer_GetById;
IF OBJECT_ID('dbo.sp_Customer_GetByUserId', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Customer_GetByUserId;
IF OBJECT_ID('dbo.sp_Customer_Update', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Customer_Update;
IF OBJECT_ID('dbo.sp_Customer_GetOrders', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Customer_GetOrders;
IF OBJECT_ID('dbo.sp_Customer_LinkOrder', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_Customer_LinkOrder;
GO

-- =============================================
-- sp_Customer_Create: Create customer profile
-- =============================================
CREATE PROCEDURE dbo.sp_Customer_Create
    @UserId INT,
    @FullName NVARCHAR(255),
    @PhoneNumber NVARCHAR(50),
    @Email NVARCHAR(255) = NULL,
    @DefaultAddress NVARCHAR(500) = NULL,
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM dbo.Customers WHERE UserId = @UserId)
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Customer profile already exists for this user.';
        SELECT * FROM dbo.Customers WHERE UserId = @UserId;
        RETURN;
    END
    
    DECLARE @Now DATETIME2 = GETUTCDATE();
    
    INSERT INTO dbo.Customers (UserId, FullName, PhoneNumber, Email, DefaultAddress, CreatedAt, UpdatedAt)
    VALUES (@UserId, @FullName, @PhoneNumber, @Email, @DefaultAddress, @Now, @Now);
    
    DECLARE @NewCustomerId INT = SCOPE_IDENTITY();
    
    SET @ResultCode = 0;
    SET @ResultMessage = 'Customer created successfully.';
    
    SELECT * FROM dbo.Customers WHERE CustomerId = @NewCustomerId;
END
GO

-- =============================================
-- sp_Customer_GetById: Get customer by ID
-- =============================================
CREATE PROCEDURE dbo.sp_Customer_GetById
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerId, UserId, FullName, PhoneNumber, Email,
        DefaultAddress, CreatedAt, UpdatedAt
    FROM dbo.Customers
    WHERE CustomerId = @CustomerId;
END
GO

-- =============================================
-- sp_Customer_GetByUserId: Get customer by User ID
-- =============================================
CREATE PROCEDURE dbo.sp_Customer_GetByUserId
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerId, UserId, FullName, PhoneNumber, Email,
        DefaultAddress, CreatedAt, UpdatedAt
    FROM dbo.Customers
    WHERE UserId = @UserId;
END
GO

-- =============================================
-- sp_Customer_Update: Update customer profile
-- =============================================
CREATE PROCEDURE dbo.sp_Customer_Update
    @CustomerId INT,
    @FullName NVARCHAR(255) = NULL,
    @PhoneNumber NVARCHAR(50) = NULL,
    @Email NVARCHAR(255) = NULL,
    @DefaultAddress NVARCHAR(500) = NULL,
    @ResultCode INT OUTPUT,
    @ResultMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId = @CustomerId)
    BEGIN
        SET @ResultCode = -1;
        SET @ResultMessage = 'Customer not found.';
        RETURN;
    END
    
    UPDATE dbo.Customers
    SET FullName = COALESCE(@FullName, FullName),
        PhoneNumber = COALESCE(@PhoneNumber, PhoneNumber),
        Email = COALESCE(@Email, Email),
        DefaultAddress = COALESCE(@DefaultAddress, DefaultAddress),
        UpdatedAt = GETUTCDATE()
    WHERE CustomerId = @CustomerId;
    
    SET @ResultCode = 0;
    SET @ResultMessage = 'Customer updated successfully.';
    
    SELECT * FROM dbo.Customers WHERE CustomerId = @CustomerId;
END
GO

-- =============================================
-- sp_Customer_GetOrders: Get customer's order history
-- =============================================
CREATE PROCEDURE dbo.sp_Customer_GetOrders
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        OrderRefId, CustomerId, OrderId, DeliveryId, Status, CreatedAt
    FROM dbo.CustomerOrders
    WHERE CustomerId = @CustomerId
    ORDER BY CreatedAt DESC;
END
GO

-- =============================================
-- sp_Customer_LinkOrder: Link order to customer
-- =============================================
CREATE PROCEDURE dbo.sp_Customer_LinkOrder
    @CustomerId INT,
    @OrderId INT,
    @DeliveryId INT = NULL,
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.CustomerOrders (CustomerId, OrderId, DeliveryId, Status, CreatedAt)
    VALUES (@CustomerId, @OrderId, @DeliveryId, @Status, GETUTCDATE());
    
    SELECT SCOPE_IDENTITY() AS OrderRefId;
END
GO

PRINT '✓ CustomerServiceDB: Stored procedures created';
GO

PRINT '';
PRINT '========================================';
PRINT 'All stored procedures created successfully!';
PRINT '========================================';
PRINT '';
PRINT 'Database-First Architecture Ready:';
PRINT '- AuthServiceDB: 7 stored procedures';
PRINT '- OrderServiceDB: 6 stored procedures';
PRINT '- DeliveryServiceDB: 10 stored procedures';
PRINT '- RiderServiceDB: 12 stored procedures';
PRINT '- CustomerServiceDB: 6 stored procedures';
PRINT '';
GO
