-- SQL Script to manually seed rider data
-- Run this script if the automatic seeding didn't work

USE RiderServiceDB;
GO

-- Clear existing data (optional - uncomment if you want to reset)
-- DELETE FROM RiderAvailability;
-- DELETE FROM Riders;
-- GO

-- Insert riders if they don't exist
IF NOT EXISTS (SELECT 1 FROM Riders WHERE RiderId = 1)
BEGIN
    INSERT INTO Riders (UserId, FullName, PhoneNumber, Email, VehicleType, VehicleNumber, LicenseNumber, IsActive, CreatedAt, UpdatedAt)
    VALUES 
        (2, 'John Rider', '+1234567890', 'john.rider@example.com', 'Motorcycle', 'MC-1234', 'DL-001', 1, GETUTCDATE(), GETUTCDATE()),
        (3, 'Sarah Driver', '+1234567891', 'sarah.driver@example.com', 'Bicycle', 'BC-5678', 'DL-002', 1, GETUTCDATE(), GETUTCDATE()),
        (4, 'Mike Courier', '+1234567892', 'mike.courier@example.com', 'Motorcycle', 'MC-9012', 'DL-003', 1, GETUTCDATE(), GETUTCDATE()),
        (5, 'Emma Delivery', '+1234567893', 'emma.delivery@example.com', 'Bicycle', 'BC-3456', 'DL-004', 1, GETUTCDATE(), GETUTCDATE()),
        (6, 'Alex Transport', '+1234567894', 'alex.transport@example.com', 'Motorcycle', 'MC-7890', 'DL-005', 0, GETUTCDATE(), GETUTCDATE());
    
    PRINT 'Riders inserted successfully';
END
ELSE
BEGIN
    PRINT 'Riders already exist';
END
GO

-- Insert availability data
IF NOT EXISTS (SELECT 1 FROM RiderAvailability WHERE RiderId = 1)
BEGIN
    INSERT INTO RiderAvailability (RiderId, IsOnline, CurrentLatitude, CurrentLongitude, LastSeen, UpdatedAt)
    VALUES 
        (1, 1, 40.7128, -74.0060, GETUTCDATE(), GETUTCDATE()),
        (2, 1, 40.7580, -73.9855, GETUTCDATE(), GETUTCDATE()),
        (3, 0, 40.7505, -73.9934, DATEADD(MINUTE, -30, GETUTCDATE()), GETUTCDATE()),
        (4, 1, 40.7282, -73.9942, GETUTCDATE(), GETUTCDATE());
    
    PRINT 'Rider availability inserted successfully';
END
ELSE
BEGIN
    PRINT 'Rider availability already exists';
END
GO

PRINT 'Seed data script completed!';
GO
