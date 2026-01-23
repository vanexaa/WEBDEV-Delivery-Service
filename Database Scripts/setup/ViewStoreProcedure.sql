-- =============================================
-- Convenience READ-ONLY VIEWS (for easier queries)
-- These views expose commonly used fields and avoid returning sensitive columns like PasswordHash.
-- Run this AFTER the stored procedures have been created.
-- =============================================

-- Public users view (no PasswordHash)
USE AuthServiceDB;
GO
IF OBJECT_ID('dbo.v_Users_Public','V') IS NOT NULL DROP VIEW dbo.v_Users_Public;
GO
CREATE VIEW dbo.v_Users_Public AS
SELECT
    UserId,
    Username,
    Email,
    Role,
    IsActive,
    CreatedAt,
    UpdatedAt
FROM dbo.Users;
GO

-- Order summary view
USE OrderServiceDB;
GO
IF OBJECT_ID('dbo.v_Order_Summary','V') IS NOT NULL DROP VIEW dbo.v_Order_Summary;
GO
CREATE VIEW dbo.v_Order_Summary AS
SELECT
    OrderId,
    CustomerId,
    CustomerName,
    OrderTotal,
    Status,
    OrderDate,
    CreatedAt
FROM dbo.Orders;
GO

-- Delivery summary view
USE DeliveryServiceDB;
GO
IF OBJECT_ID('dbo.v_Delivery_Summary','V') IS NOT NULL DROP VIEW dbo.v_Delivery_Summary;
GO
CREATE VIEW dbo.v_Delivery_Summary AS
SELECT
    DeliveryId,
    OrderId,
    RiderId,
    Status,
    AssignedAt,
    PickedUpAt,
    DeliveredAt,
    CreatedAt
FROM dbo.Deliveries;
GO

-- Riders with availability view
USE RiderServiceDB;
GO
IF OBJECT_ID('dbo.v_Riders_WithAvailability','V') IS NOT NULL DROP VIEW dbo.v_Riders_WithAvailability;
GO
CREATE VIEW dbo.v_Riders_WithAvailability AS
SELECT
    r.RiderId,
    r.UserId,
    r.FullName,
    r.PhoneNumber,
    r.Email,
    r.VehicleType,
    r.VehicleNumber,
    r.IsActive,
    ra.IsOnline,
    ra.CurrentLatitude,
    ra.CurrentLongitude,
    ra.LastSeen
FROM dbo.Riders r
LEFT JOIN dbo.RiderAvailability ra ON r.RiderId = ra.RiderId;
GO

-- Customer order history view
USE CustomerServiceDB;
GO
IF OBJECT_ID('dbo.v_Customer_GetOrders','V') IS NOT NULL DROP VIEW dbo.v_Customer_GetOrders;
GO
CREATE VIEW dbo.v_Customer_GetOrders AS
SELECT
    OrderRefId,
    CustomerId,
    OrderId,
    DeliveryId,
    Status,
    CreatedAt
FROM dbo.CustomerOrders;
GO
