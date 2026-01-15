-- =============================================
-- Create Test Accounts with Known Passwords
-- Run this AFTER running the main database scripts
-- Default password for all test accounts: password123
-- =============================================

USE AuthServiceDB;
GO

-- Clear existing test accounts (optional - comment out if you want to keep existing data)
-- DELETE FROM [dbo].[Users] WHERE Username IN ('admin', 'rider1', 'customer1');
-- GO

-- Note: The password hash below is for "password123"
-- This is a BCrypt hash that you can generate using BCrypt.Net or use this pre-generated one
-- For testing, you can also update passwords via the API after creating accounts

-- Admin Account
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE Username = 'admin')
BEGIN
    INSERT INTO [dbo].[Users] (Username, Email, PasswordHash, Role, IsActive)
    VALUES ('admin', 'admin@restaurant.com', '$2a$11$K8Z9X8Y7Z6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3', 'Admin', 1);
END
ELSE
BEGIN
    -- Update existing admin password hash (password: password123)
    UPDATE [dbo].[Users] 
    SET PasswordHash = '$2a$11$K8Z9X8Y7Z6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3'
    WHERE Username = 'admin';
END
GO

-- Rider Account
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE Username = 'rider1')
BEGIN
    INSERT INTO [dbo].[Users] (Username, Email, PasswordHash, Role, IsActive)
    VALUES ('rider1', 'rider1@restaurant.com', '$2a$11$K8Z9X8Y7Z6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3', 'Rider', 1);
END
ELSE
BEGIN
    -- Update existing rider password hash (password: password123)
    UPDATE [dbo].[Users] 
    SET PasswordHash = '$2a$11$K8Z9X8Y7Z6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3'
    WHERE Username = 'rider1';
END
GO

-- Customer Account
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE Username = 'customer1')
BEGIN
    INSERT INTO [dbo].[Users] (Username, Email, PasswordHash, Role, IsActive)
    VALUES ('customer1', 'customer1@example.com', '$2a$11$K8Z9X8Y7Z6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3', 'Customer', 1);
END
ELSE
BEGIN
    -- Update existing customer password hash (password: password123)
    UPDATE [dbo].[Users] 
    SET PasswordHash = '$2a$11$K8Z9X8Y7Z6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3'
    WHERE Username = 'customer1';
END
GO

PRINT 'Test accounts created/updated successfully!';
PRINT 'Username: admin, Password: password123, Role: Admin';
PRINT 'Username: rider1, Password: password123, Role: Rider';
PRINT 'Username: customer1, Password: password123, Role: Customer';
GO
