USE DeliveryServiceDB;
GO

-- We use 'Id' because that is the name in your table
SET IDENTITY_INSERT Deliveries ON; 

INSERT INTO Deliveries (
    Id, 
    OrderId, 
    RiderId, 
    CustomerId, -- Changed from CustomerName because your table uses CustomerId (int)
    Status, 
    EstimatedTimeOfArrival,
    CurrentLocationSimulation -- Added this as it exists in your schema
)
VALUES (
    1, 
    101, 
    5, 
    99, -- Providing an integer for CustomerId
    'In Transit', 
    GETDATE(),
    '123 Web Dev Lane'
);

SET IDENTITY_INSERT Deliveries OFF;
GO

SELECT * FROM Deliveries;