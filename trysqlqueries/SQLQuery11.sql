USE AuthServiceDB;
GO

UPDATE [dbo].[Users] 
SET PasswordHash = '$2a$11$K8Z9X8Y7Z6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3'
WHERE Username = 'rider1';

-- Also, let's make sure the role is exactly 'Rider' (Capital R)
UPDATE [dbo].[Users]
SET Role = 'Rider', IsActive = 1
WHERE Username = 'rider1';
GO