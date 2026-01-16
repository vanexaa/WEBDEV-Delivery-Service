/*
 * Fix Foreign Key Constraint Issue in DeliveryServiceDB
 * 
 * This script removes the invalid foreign key constraint from Deliveries table
 * that references Orders table in DeliveryServiceDB.
 * 
 * Orders are stored in OrderServiceDB, not DeliveryServiceDB.
 * The Deliveries table should only store OrderId as a reference (integer), not as a foreign key.
 */

USE DeliveryServiceDB;
GO

-- Check if the foreign key constraint exists and drop it
-- The constraint name may vary, so check for any FK on Deliveries.OrderId
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('dbo.Deliveries')
  AND referenced_object_id = OBJECT_ID('dbo.Orders');

IF @ConstraintName IS NOT NULL
BEGIN
    PRINT 'Dropping foreign key constraint: ' + @ConstraintName;
    DECLARE @Sql NVARCHAR(MAX) = 'ALTER TABLE dbo.Deliveries DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
    EXEC sp_executesql @Sql;
    PRINT 'Foreign key constraint dropped successfully.';
END
ELSE
BEGIN
    PRINT 'No foreign key constraint found on Deliveries.OrderId referencing Orders table.';
END
GO

-- Also check for and remove the Orders table if it exists in DeliveryServiceDB
-- (it shouldn't be here - orders belong in OrderServiceDB)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Orders' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    -- Check if there are any foreign keys referencing this table first
    DECLARE @FKCount INT;
    SELECT @FKCount = COUNT(*)
    FROM sys.foreign_keys
    WHERE referenced_object_id = OBJECT_ID('dbo.Orders');
    
    IF @FKCount > 0
    BEGIN
        PRINT 'Warning: Cannot drop Orders table because there are foreign key constraints referencing it.';
        PRINT 'Please manually review and drop the foreign key constraints first.';
    END
    ELSE
    BEGIN
        PRINT 'Dropping Orders table from DeliveryServiceDB (orders should be in OrderServiceDB only).';
        DROP TABLE dbo.Orders;
        PRINT 'Orders table dropped successfully.';
    END
END
ELSE
BEGIN
    PRINT 'Orders table does not exist in DeliveryServiceDB (this is correct).';
END
GO

PRINT 'Script completed.';
PRINT 'Deliveries table now only stores OrderId as a reference (integer), not as a foreign key.';
GO
