-- =============================================
-- Complete Automatic Database Setup Script
-- Run this ONE script to create all databases and tables automatically
-- =============================================

USE master;
GO

PRINT '========================================';
PRINT 'Complete Database Setup for Delivery Service';
PRINT '========================================';
PRINT '';

-- =============================================
-- STEP 1: Create All Databases
-- =============================================
PRINT 'STEP 1: Creating databases...';
PRINT '';

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AuthServiceDB')
BEGIN
    CREATE DATABASE AuthServiceDB;
    PRINT '✓ AuthServiceDB created';
END
ELSE
BEGIN
    PRINT '⚠ AuthServiceDB already exists';
END
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DeliveryServiceDB')
BEGIN
    CREATE DATABASE DeliveryServiceDB;
    PRINT '✓ DeliveryServiceDB created';
END
ELSE
BEGIN
    PRINT '⚠ DeliveryServiceDB already exists';
END
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'RiderServiceDB')
BEGIN
    CREATE DATABASE RiderServiceDB;
    PRINT '✓ RiderServiceDB created';
END
ELSE
BEGIN
    PRINT '⚠ RiderServiceDB already exists';
END
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'CustomerServiceDB')
BEGIN
    CREATE DATABASE CustomerServiceDB;
    PRINT '✓ CustomerServiceDB created';
END
ELSE
BEGIN
    PRINT '⚠ CustomerServiceDB already exists';
END
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'OrderServiceDB')
BEGIN
    CREATE DATABASE OrderServiceDB;
    PRINT '✓ OrderServiceDB created';
END
ELSE
BEGIN
    PRINT '⚠ OrderServiceDB already exists';
END
GO

PRINT '';
PRINT 'STEP 2: Creating tables...';
PRINT '';

-- =============================================
-- STEP 2: AuthServiceDB Tables
-- =============================================
USE AuthServiceDB;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Users] (
        [UserId] INT IDENTITY(1,1) PRIMARY KEY,
        [Username] NVARCHAR(100) NOT NULL UNIQUE,
        [Email] NVARCHAR(255) NOT NULL UNIQUE,
        [PasswordHash] NVARCHAR(500) NOT NULL,
        [Role] NVARCHAR(50) NOT NULL CHECK ([Role] IN ('Customer', 'Rider', 'Admin')),
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_Users_Username ON [dbo].[Users]([Username]);
    CREATE INDEX IX_Users_Email ON [dbo].[Users]([Email]);
    CREATE INDEX IX_Users_Role ON [dbo].[Users]([Role]);
    PRINT '✓ AuthServiceDB: Users table created';
END
ELSE
BEGIN
    PRINT '⚠ AuthServiceDB: Users table already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RefreshTokens]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RefreshTokens] (
        [TokenId] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL,
        [Token] NVARCHAR(500) NOT NULL UNIQUE,
        [ExpiresAt] DATETIME2 NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([UserId]) ON DELETE CASCADE
    );
    CREATE INDEX IX_RefreshTokens_UserId ON [dbo].[RefreshTokens]([UserId]);
    CREATE INDEX IX_RefreshTokens_Token ON [dbo].[RefreshTokens]([Token]);
    PRINT '✓ AuthServiceDB: RefreshTokens table created';
END
ELSE
BEGIN
    PRINT '⚠ AuthServiceDB: RefreshTokens table already exists';
END
GO

-- =============================================
-- STEP 3: DeliveryServiceDB Tables
-- =============================================
USE DeliveryServiceDB;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Deliveries]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Deliveries] (
        [DeliveryId] INT IDENTITY(1,1) PRIMARY KEY,
        [OrderId] INT NOT NULL,
        [RiderId] INT,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [AssignedAt] DATETIME2,
        [PickedUpAt] DATETIME2,
        [DeliveredAt] DATETIME2,
        [FailedAt] DATETIME2,
        [FailureReason] NVARCHAR(500),
        [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_Deliveries_OrderId ON [dbo].[Deliveries]([OrderId]);
    CREATE INDEX IX_Deliveries_RiderId ON [dbo].[Deliveries]([RiderId]);
    CREATE INDEX IX_Deliveries_Status ON [dbo].[Deliveries]([Status]);
    PRINT '✓ DeliveryServiceDB: Deliveries table created';
END
ELSE
BEGIN
    PRINT '⚠ DeliveryServiceDB: Deliveries table already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeliveryTracking]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DeliveryTracking] (
        [TrackingId] INT IDENTITY(1,1) PRIMARY KEY,
        [DeliveryId] INT NOT NULL,
        [Status] NVARCHAR(50) NOT NULL,
        [LocationLatitude] DECIMAL(9,6),
        [LocationLongitude] DECIMAL(9,6),
        [Notes] NVARCHAR(1000),
        [Timestamp] DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY ([DeliveryId]) REFERENCES [dbo].[Deliveries]([DeliveryId]) ON DELETE CASCADE
    );
    CREATE INDEX IX_DeliveryTracking_DeliveryId ON [dbo].[DeliveryTracking]([DeliveryId]);
    PRINT '✓ DeliveryServiceDB: DeliveryTracking table created';
END
ELSE
BEGIN
    PRINT '⚠ DeliveryServiceDB: DeliveryTracking table already exists';
END
GO

-- =============================================
-- STEP 4: RiderServiceDB Tables
-- =============================================
USE RiderServiceDB;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Riders]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Riders] (
        [RiderId] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL UNIQUE,
        [FullName] NVARCHAR(255) NOT NULL,
        [PhoneNumber] NVARCHAR(50) NOT NULL,
        [Email] NVARCHAR(255) NULL,
        [VehicleType] NVARCHAR(50) NULL,
        [VehicleNumber] NVARCHAR(50) NULL,
        [LicenseNumber] NVARCHAR(100) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_Riders_UserId ON [dbo].[Riders]([UserId]);
    CREATE INDEX IX_Riders_IsActive ON [dbo].[Riders]([IsActive]);
    PRINT '✓ RiderServiceDB: Riders table created';
END
ELSE
BEGIN
    PRINT '⚠ RiderServiceDB: Riders table already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RiderAvailability]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RiderAvailability] (
        [AvailabilityId] INT IDENTITY(1,1) PRIMARY KEY,
        [RiderId] INT NOT NULL,
        [IsOnline] BIT NOT NULL DEFAULT 0,
        [CurrentLatitude] DECIMAL(10,8) NULL,
        [CurrentLongitude] DECIMAL(11,8) NULL,
        [LastSeen] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([RiderId]) REFERENCES [dbo].[Riders]([RiderId]) ON DELETE CASCADE
    );
    CREATE INDEX IX_RiderAvailability_RiderId ON [dbo].[RiderAvailability]([RiderId]);
    PRINT '✓ RiderServiceDB: RiderAvailability table created';
END
ELSE
BEGIN
    PRINT '⚠ RiderServiceDB: RiderAvailability table already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RiderEarnings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RiderEarnings] (
        [EarningId] INT IDENTITY(1,1) PRIMARY KEY,
        [RiderId] INT NOT NULL,
        [DeliveryId] INT NOT NULL,
        [OrderId] INT NOT NULL,
        [Amount] DECIMAL(10,2) NOT NULL,
        [CommissionRate] DECIMAL(5,2) NOT NULL DEFAULT 10.00,
        [EarningDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK ([Status] IN ('Pending', 'Paid', 'Cancelled')),
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([RiderId]) REFERENCES [dbo].[Riders]([RiderId]) ON DELETE CASCADE
    );
    CREATE INDEX IX_RiderEarnings_RiderId ON [dbo].[RiderEarnings]([RiderId]);
    CREATE INDEX IX_RiderEarnings_DeliveryId ON [dbo].[RiderEarnings]([DeliveryId]);
    CREATE INDEX IX_RiderEarnings_EarningDate ON [dbo].[RiderEarnings]([EarningDate]);
    CREATE INDEX IX_RiderEarnings_Status ON [dbo].[RiderEarnings]([Status]);
    PRINT '✓ RiderServiceDB: RiderEarnings table created';
END
ELSE
BEGIN
    PRINT '⚠ RiderServiceDB: RiderEarnings table already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RiderFeedback]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RiderFeedback] (
        [FeedbackId] INT IDENTITY(1,1) PRIMARY KEY,
        [RiderId] INT NOT NULL,
        [DeliveryId] INT NOT NULL,
        [OrderId] INT NOT NULL,
        [Rating] INT NOT NULL CHECK ([Rating] BETWEEN 1 AND 5),
        [Comment] NVARCHAR(1000) NULL,
        [CustomerId] INT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([RiderId]) REFERENCES [dbo].[Riders]([RiderId]) ON DELETE CASCADE
    );
    CREATE INDEX IX_RiderFeedback_RiderId ON [dbo].[RiderFeedback]([RiderId]);
    CREATE INDEX IX_RiderFeedback_DeliveryId ON [dbo].[RiderFeedback]([DeliveryId]);
    CREATE INDEX IX_RiderFeedback_Rating ON [dbo].[RiderFeedback]([Rating]);
    PRINT '✓ RiderServiceDB: RiderFeedback table created';
END
ELSE
BEGIN
    PRINT '⚠ RiderServiceDB: RiderFeedback table already exists';
END
GO

-- =============================================
-- STEP 5: CustomerServiceDB Tables
-- =============================================
USE CustomerServiceDB;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Customers] (
        [CustomerId] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL UNIQUE,
        [FullName] NVARCHAR(255) NOT NULL,
        [PhoneNumber] NVARCHAR(50) NOT NULL,
        [Email] NVARCHAR(255) NULL,
        [DefaultAddress] NVARCHAR(500) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_Customers_UserId ON [dbo].[Customers]([UserId]);
    PRINT '✓ CustomerServiceDB: Customers table created';
END
ELSE
BEGIN
    PRINT '⚠ CustomerServiceDB: Customers table already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CustomerOrders]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CustomerOrders] (
        [OrderRefId] INT IDENTITY(1,1) PRIMARY KEY,
        [CustomerId] INT NOT NULL,
        [OrderId] INT NOT NULL,
        [DeliveryId] INT NULL,
        [Status] NVARCHAR(50) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customers]([CustomerId]) ON DELETE CASCADE
    );
    CREATE INDEX IX_CustomerOrders_CustomerId ON [dbo].[CustomerOrders]([CustomerId]);
    CREATE INDEX IX_CustomerOrders_OrderId ON [dbo].[CustomerOrders]([OrderId]);
    PRINT '✓ CustomerServiceDB: CustomerOrders table created';
END
ELSE
BEGIN
    PRINT '⚠ CustomerServiceDB: CustomerOrders table already exists';
END
GO

-- =============================================
-- STEP 6: OrderServiceDB Tables
-- =============================================
USE OrderServiceDB;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Orders] (
        [OrderId] INT IDENTITY(1,1) PRIMARY KEY,
        [CustomerId] INT NOT NULL,
        [CustomerName] NVARCHAR(255) NOT NULL,
        [CustomerPhone] NVARCHAR(50) NOT NULL,
        [DeliveryAddress] NVARCHAR(500) NOT NULL,
        [SpecialInstructions] NVARCHAR(1000) NULL,
        [OrderTotal] DECIMAL(18,2) NOT NULL,
        [PaymentMethod] NVARCHAR(50) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [OrderDate] DATETIME2 DEFAULT GETUTCDATE(),
        [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_Orders_CustomerId ON [dbo].[Orders]([CustomerId]);
    CREATE INDEX IX_Orders_Status ON [dbo].[Orders]([Status]);
    CREATE INDEX IX_Orders_OrderDate ON [dbo].[Orders]([OrderDate]);
    PRINT '✓ OrderServiceDB: Orders table created';
END
ELSE
BEGIN
    PRINT '⚠ OrderServiceDB: Orders table already exists';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Database setup completed successfully!';
PRINT '========================================';
PRINT '';
PRINT 'Next step: Run 01_CreateTestAccounts.sql to create test users';
PRINT '';
