# Fix for Foreign Key Constraint Error

## Problem
Error when assigning orders:
```
The INSERT statement conflicted with the FOREIGN KEY constraint "FK__Deliverie__Order__440B1D61".
The conflict occurred in database "DeliveryServiceDB", table "dbo.Orders", column 'OrderId'.
```

## Root Cause
There's a foreign key constraint in `DeliveryServiceDB` that tries to reference an `Orders` table within the same database. However:
- **Orders are stored in `OrderServiceDB`, NOT `DeliveryServiceDB`**
- The `Deliveries` table should only store `OrderId` as a simple integer reference, not as a foreign key
- The foreign key constraint is invalid and must be removed

## Solution

### Option 1: Run SQL Script (Recommended)
Run the SQL script to remove the invalid foreign key constraint:

```sql
USE DeliveryServiceDB;
GO

-- Find and drop the foreign key constraint
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('dbo.Deliveries')
  AND name LIKE '%Order%';

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @Sql NVARCHAR(MAX) = 'ALTER TABLE dbo.Deliveries DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
    EXEC sp_executesql @Sql;
    PRINT 'Foreign key constraint dropped: ' + @ConstraintName;
END
ELSE
BEGIN
    PRINT 'No foreign key constraint found.';
END
GO
```

Or run the provided script:
**File:** `Database Scripts/11_RemoveDeliveryOrderForeignKey.sql`

### Option 2: Drop and Recreate Database (Development Only)
If this is a development database and you can lose data:

1. Stop the UnifiedService
2. Delete `DeliveryServiceDB` database
3. Restart UnifiedService - it will recreate the database without the foreign key constraint

### Option 3: Manual Fix via SQL Server Management Studio
1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Navigate to: `DeliveryServiceDB` → `Tables` → `dbo.Deliveries` → `Keys`
4. Find the foreign key constraint (name starts with `FK__Deliverie__Order`)
5. Right-click → Delete → OK

## Verification

After running the fix, verify:

```sql
USE DeliveryServiceDB;
GO

-- Should return 0 foreign keys on Deliveries.OrderId
SELECT COUNT(*) as FK_Count
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('dbo.Deliveries')
  AND name LIKE '%Order%';
```

## Prevention

The `DeliveryDbContext` is now configured to NOT create foreign key constraints for `OrderId`. The code explicitly treats `OrderId` as a simple integer reference.

## After Fix

Once the constraint is removed:
1. Restart the UnifiedService
2. Try assigning orders again from Admin Dashboard
3. The assignment should work without errors

---

**Note:** This constraint was likely created by an old migration or manual database schema change. The current code does NOT create this constraint.
