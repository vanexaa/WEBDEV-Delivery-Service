USE DeliveryServiceDB;
GO
SELECT OrderId, CustomerRating, CustomerFeedback 
FROM Deliveries 
WHERE OrderId = 101;