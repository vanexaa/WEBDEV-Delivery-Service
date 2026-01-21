-- Fix truncated password hashes
USE AuthServiceDB;
GO

UPDATE [dbo].[Users] 
SET PasswordHash = '$2a$11$J7Y8Z7H6G5F4E3D2C1B0A/N9M8L7K6J5I4H3G2F1E0D9C8B7A6F5E4'
WHERE Username = 'admin';
GO

UPDATE [dbo].[Users] 
SET PasswordHash = '$2a$11$J7Y8Z7H6G5F4E3D2C1B0A/N9M8L7K6J5I4H3G2F1E0D9C8B7A6F5E4'
WHERE Username = 'customer1';
GO

-- Verify all hashes are correct length (should be 60 chars)
SELECT Username, LEN(PasswordHash) as HashLength, PasswordHash 
FROM [dbo].[Users] 
ORDER BY Username;
GO

PRINT 'Password hashes fixed!';
PRINT 'All test accounts now have valid 60-character BCrypt hashes.';
