-- =============================================
-- Create Rider Record for Existing User
-- This script creates a rider record in RiderServiceDB for an existing user
-- Run this if you have a user with role 'Rider' but no corresponding rider record
-- =============================================

USE RiderServiceDB;
GO

-- Get the UserId for rider1 from AuthServiceDB
DECLARE @RiderUserId INT;
SELECT @RiderUserId = UserId 
FROM AuthServiceDB.[dbo].[Users] 
WHERE Username = 'rider1' AND Role = 'Rider';

IF @RiderUserId IS NULL
BEGIN
    PRINT '⚠ ERROR: rider1 user not found in AuthServiceDB.';
    PRINT '   Please run 05_CreateTestAccounts.sql first to create the user account.';
    RETURN;
END

PRINT 'Found rider1 user with UserId: ' + CAST(@RiderUserId AS NVARCHAR(10));
PRINT '';

DECLARE @RiderId INT;

-- Check if rider record already exists
IF EXISTS (SELECT 1 FROM [dbo].[Riders] WHERE UserId = @RiderUserId)
BEGIN
    SELECT @RiderId = RiderId FROM [dbo].[Riders] WHERE UserId = @RiderUserId;
    PRINT '✓ Rider record already exists:';
    PRINT '   RiderId: ' + CAST(@RiderId AS NVARCHAR(10));
    PRINT '   UserId: ' + CAST(@RiderUserId AS NVARCHAR(10));
    PRINT '';
END
ELSE
BEGIN
    -- Create rider record
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
        'John Doe', 
        '555-123-4567', 
        'rider1@restaurant.com', 
        'Motorcycle', 
        'ABC-1234',
        'DL-12345',
        1
    );

    SET @RiderId = SCOPE_IDENTITY();
    PRINT '✓ Rider record created successfully:';
    PRINT '   RiderId: ' + CAST(@RiderId AS NVARCHAR(10));
    PRINT '   UserId: ' + CAST(@RiderUserId AS NVARCHAR(10));
    PRINT '   FullName: John Doe';
    PRINT '   Vehicle: Motorcycle - ABC-1234';
    PRINT '';
END

-- Ensure rider availability record exists
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
        0, -- Default to offline
        GETUTCDATE(), 
        GETUTCDATE()
    );
    PRINT '✓ Rider availability record created (default: offline)';
END
ELSE
BEGIN
    PRINT '✓ Rider availability record already exists';
END

PRINT '';
PRINT '========================================';
PRINT 'Summary';
PRINT '========================================';
PRINT 'RiderId: ' + CAST(@RiderId AS NVARCHAR(10));
PRINT 'UserId: ' + CAST(@RiderUserId AS NVARCHAR(10));
PRINT '';
PRINT 'You can now:';
PRINT '  1. Log in as rider1 (password: password123)';
PRINT '  2. The riderId will be available in the login response';
PRINT '  3. The availability toggle will function correctly';
PRINT '';
PRINT '========================================';
PRINT 'Script completed successfully!';
PRINT '========================================';
GO
