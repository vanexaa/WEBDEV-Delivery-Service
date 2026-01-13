USE OrderServiceDB;
GO

-- If your table is missing the RiderId (to assign orders to you), add it:
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = 'RiderId' AND Object_ID = Object_Id('Orders'))
BEGIN
    ALTER TABLE Orders ADD RiderId INT NULL;
END
GO