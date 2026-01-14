USE AuthServiceDB;
GO

-- 1. Delete any half-created records
DELETE FROM [dbo].[Users] WHERE Username = 'rider1';
GO

-- 2. Insert with the missing 'UpdatedAt' and 'CreatedAt' fields
INSERT INTO [dbo].[Users] (Username, Email, PasswordHash, Role, IsActive, CreatedAt, UpdatedAt)
VALUES (
    'rider1', 
    'rider1@restaurant.com', 
    '$2a$11$K8Z9X8Y7Z6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3', -- password123
    'Rider', 
    1,
    GETDATE(), -- Sets CreatedAt to right now
    GETDATE()  -- Sets UpdatedAt to right now (Fixes your Msg 515 error!)
);
GO

-- 3. Check if it worked
SELECT * FROM [dbo].[Users] WHERE Username = 'rider1';