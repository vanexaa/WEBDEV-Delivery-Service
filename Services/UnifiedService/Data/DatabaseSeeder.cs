/*
 * UnifiedService Architecture - Database Seeder
 * 
 * This seeder populates the database with mock data for development and testing.
 * 
 * IMPORTANT: This is MOCK DATA for development only.
 * In production, replace this with real data from your application flow.
 * 
 * Data Flow:
 * Database (seeded mock data) → Repository/Service → Controller/API → Frontend
 */

using DeliveryService.Data;
using DeliveryService.Models;
using OrderService.Data;
using OrderService.Models;
using RiderService.Data;
using RiderService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DeliveryService.Data;

/// <summary>
/// Database seeder for populating mock delivery and order data.
/// This data is stored in the database and can be replaced with real production data
/// without changing the frontend code.
/// </summary>
public static class DatabaseSeeder
{
    /// <summary>
    /// Seed mock delivery and order data into the database.
    /// This method creates realistic sample data for testing the delivery history pages.
    /// </summary>
    public static async Task SeedMockDeliveryDataAsync(
        DeliveryDbContext deliveryContext,
        OrderDbContext orderContext,
        RiderDbContext riderContext,
        ILogger logger)
    {
        try
        {
            logger.LogInformation("Starting database seeding for delivery history mock data...");

            // Check if data already exists
            var existingDeliveries = await deliveryContext.Deliveries.CountAsync();
            if (existingDeliveries > 0)
            {
                logger.LogInformation("Delivery data already exists ({Count} deliveries). Skipping seed.", existingDeliveries);
                return;
            }

            // Get or create riders (we need rider IDs for deliveries)
            var riders = await EnsureRidersExistAsync(riderContext, logger);
            
            // Generate mock customer data
            var customerNames = new[]
            {
                "Alice Thompson", "Bob Martinez", "Carol White", "Daniel Brown",
                "Eva Garcia", "Frank Miller", "Grace Lee", "Henry Davis",
                "Ivy Wilson", "Jack Anderson", "Kate Taylor", "Liam Moore",
                "Mia Jackson", "Noah Harris", "Olivia Martin", "Paul Lewis",
                "Quinn Walker", "Rachel Hall", "Sam Young", "Tina King"
            };

            var addresses = new[]
            {
                "123 Main Street, Downtown District, City 10001",
                "456 Oak Avenue, Riverside, City 10002",
                "789 Pine Road, Uptown, City 10003",
                "321 Elm Street, Midtown, City 10004",
                "654 Maple Drive, Suburbia, City 10005",
                "987 Cedar Lane, Parkview, City 10006",
                "147 Birch Boulevard, Hillside, City 10007",
                "258 Spruce Court, Waterfront, City 10008",
                "369 Willow Way, Greenfield, City 10009",
                "741 Ash Street, Valley View, City 10010"
            };

            var paymentMethods = new[] { "Cash on Delivery", "Online Payment", "Credit Card" };
            var statuses = new[] { "Completed", "Failed", "In Progress", "Assigned", "PickedUp", "InTransit" };

            var now = DateTime.UtcNow;
            var orders = new List<Order>();
            var deliveries = new List<Delivery>();
            var random = new Random();

            // Generate 50 orders and deliveries
            for (int i = 1; i <= 50; i++)
            {
                // Create order
                var daysAgo = random.Next(0, 90); // Last 90 days
                var orderDate = now.AddDays(-daysAgo);
                orderDate = orderDate.AddHours(random.Next(0, 24)).AddMinutes(random.Next(0, 60));

                var order = new Order
                {
                    OrderId = 1000 + i, // Start from 1001
                    CustomerId = random.Next(1, 100), // Mock customer IDs
                    CustomerName = customerNames[random.Next(customerNames.Length)],
                    CustomerPhone = $"+1-555-{random.Next(1000, 9999)}",
                    DeliveryAddress = addresses[random.Next(addresses.Length)],
                    OrderTotal = (decimal)(random.NextDouble() * 100 + 10), // $10-$110
                    PaymentMethod = paymentMethods[random.Next(paymentMethods.Length)],
                    OrderDate = orderDate,
                    Status = "Delivered", // Most orders are delivered
                    CreatedAt = orderDate,
                    UpdatedAt = orderDate
                };

                orders.Add(order);

                // Create corresponding delivery
                var rider = riders[random.Next(riders.Count)];
                var isCompleted = random.NextDouble() > 0.2; // 80% completed
                var deliveryStatus = isCompleted 
                    ? "Completed" 
                    : statuses[random.Next(2, statuses.Length)]; // Failed or In Progress

                var assignedAt = orderDate;
                var deliveredAt = isCompleted 
                    ? assignedAt.AddHours(random.Next(1, 4)) 
                    : (DateTime?)null;

                var delivery = new Delivery
                {
                    OrderId = order.OrderId,
                    RiderId = rider.RiderId,
                    Status = deliveryStatus,
                    RestaurantLatitude = 40.7128m, // Mock restaurant location
                    RestaurantLongitude = -74.0060m,
                    DeliveryLatitude = 40.7580m + (decimal)(random.NextDouble() * 0.1),
                    DeliveryLongitude = -73.9855m + (decimal)(random.NextDouble() * 0.1),
                    AssignedAt = assignedAt,
                    AcceptedAt = assignedAt.AddMinutes(random.Next(5, 30)),
                    PickedUpAt = assignedAt.AddMinutes(random.Next(30, 60)),
                    DeliveredAt = deliveredAt,
                    FailedAt = !isCompleted && deliveryStatus == "Failed" ? assignedAt.AddHours(2) : null,
                    FailureReason = !isCompleted && deliveryStatus == "Failed" 
                        ? "Customer not available" 
                        : null,
                    CreatedAt = assignedAt,
                    UpdatedAt = assignedAt
                };

                deliveries.Add(delivery);
            }

            // Save orders to OrderServiceDB
            await orderContext.Orders.AddRangeAsync(orders);
            await orderContext.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} orders into OrderServiceDB", orders.Count);

            // Save deliveries to DeliveryServiceDB
            await deliveryContext.Deliveries.AddRangeAsync(deliveries);
            await deliveryContext.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} deliveries into DeliveryServiceDB", deliveries.Count);

            logger.LogInformation("Database seeding completed successfully!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding database with mock delivery data");
            throw;
        }
    }

    /// <summary>
    /// Ensure riders exist in the database. Returns list of riders.
    /// </summary>
    private static async Task<List<Rider>> EnsureRidersExistAsync(RiderDbContext riderContext, ILogger logger)
    {
        var riders = await riderContext.Riders.ToListAsync();
        
        if (riders.Count == 0)
        {
            logger.LogInformation("No riders found. Creating mock riders...");
            
            // Create 5 mock riders including Emma Delivery
            var newRiders = new List<Rider>
            {
                new Rider
                {
                    RiderId = 1,
                    UserId = 1, // Mock user ID
                    FullName = "John Smith",
                    PhoneNumber = "+1-555-0101",
                    Email = "john.smith@example.com",
                    VehicleType = "Motorcycle",
                    VehicleNumber = "MC-1234",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Rider
                {
                    RiderId = 2,
                    UserId = 2,
                    FullName = "Emma Delivery",
                    PhoneNumber = "+1-555-0102",
                    Email = "emma.delivery@example.com",
                    VehicleType = "Motorcycle",
                    VehicleNumber = "MC-5678",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Rider
                {
                    RiderId = 3,
                    UserId = 3,
                    FullName = "Michael Chen",
                    PhoneNumber = "+1-555-0103",
                    Email = "michael.chen@example.com",
                    VehicleType = "Bicycle",
                    VehicleNumber = "BC-9012",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Rider
                {
                    RiderId = 4,
                    UserId = 4,
                    FullName = "Sarah Johnson",
                    PhoneNumber = "+1-555-0104",
                    Email = "sarah.johnson@example.com",
                    VehicleType = "Motorcycle",
                    VehicleNumber = "MC-3456",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Rider
                {
                    RiderId = 5,
                    UserId = 5,
                    FullName = "David Williams",
                    PhoneNumber = "+1-555-0105",
                    Email = "david.williams@example.com",
                    VehicleType = "Bicycle",
                    VehicleNumber = "BC-7890",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await riderContext.Riders.AddRangeAsync(newRiders);
            await riderContext.SaveChangesAsync();
            logger.LogInformation("Created {Count} mock riders", newRiders.Count);
            
            return newRiders;
        }

        return riders;
    }
}
