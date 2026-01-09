using Microsoft.EntityFrameworkCore;
using Ayawkomagbackend.Data;
using Ayawkomagbackend.DTOs;
using Ayawkomagbackend.Models;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------
// Configure Services
// ---------------------------

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// EF Core DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    // Read connection string from appsettings.json
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString);
});

var app = builder.Build();

// ---------------------------
// Configure Middleware Pipeline
// ---------------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Optional HTTPS redirection
// app.UseHttpsRedirection();

// ---------------------------
// Delivery Endpoints
// ---------------------------

// Assign a rider to an order
app.MapPost("/api/deliveries/assign", async (AssignDeliveryDto dto, ApplicationDbContext db) =>
{
    // Validation
    if (dto.OrderId <= 0 || dto.RiderId <= 0)
        return Results.BadRequest("OrderId and RiderId are required.");

    var delivery = await db.Deliveries.FirstOrDefaultAsync(d => d.OrderId == dto.OrderId);
    if (delivery == null)
        return Results.NotFound("Delivery not found for the specified OrderId.");

    var rider = await db.Riders.FindAsync(dto.RiderId);
    if (rider == null)
        return Results.NotFound("Rider not found.");
    if (!rider.IsAvailable)
        return Results.BadRequest("Rider is not available.");

    // Assign
    delivery.RiderId = dto.RiderId;
    delivery.Status = "Assigned";
    delivery.UpdatedAt = DateTime.UtcNow;

    db.DeliveryAssignments.Add(new DeliveryAssignment
    {
        DeliveryId = delivery.DeliveryId,
        RiderId = rider.RiderId,
        AssignedAt = DateTime.UtcNow,
        IsActive = true
    });

    await db.SaveChangesAsync();
    return Results.Ok("Rider assigned to delivery.");
}).WithName("AssignDelivery");

// Get delivery details by orderId
app.MapGet("/api/deliveries/{orderId}", async (int orderId, ApplicationDbContext db) =>
{
    var delivery = await db.Deliveries
        .Include(d => d.Rider)
        .FirstOrDefaultAsync(d => d.OrderId == orderId);

    if (delivery == null)
        return Results.NotFound();

    var dto = new DeliveryDetailsDto
    {
        DeliveryId = delivery.DeliveryId,
        OrderId = delivery.OrderId,
        RiderId = delivery.RiderId,
        RiderName = delivery.Rider?.Name,
        Status = delivery.Status,
        CreatedAt = delivery.CreatedAt,
        UpdatedAt = delivery.UpdatedAt
        // You can add address, ETA, etc. if included in the entity
    };
    return Results.Ok(dto);
}).WithName("GetDeliveryDetails");

// Get all ongoing deliveries
app.MapGet("/api/deliveries/active", async (ApplicationDbContext db) =>
{
    var ongoingStatuses = new[] { "Assigned", "PickedUp", "InTransit" };
    var deliveries = await db.Deliveries
        .Where(d => ongoingStatuses.Contains(d.Status))
        .ToListAsync();
    return Results.Ok(deliveries);
}).WithName("GetActiveDeliveries");

// Reassign delivery (admin)
app.MapPut("/api/deliveries/{orderId}/reassign", async (int orderId, ReassignDeliveryDto dto, ApplicationDbContext db) =>
{
    var delivery = await db.Deliveries.FirstOrDefaultAsync(d => d.OrderId == orderId);
    if (delivery == null)
        return Results.NotFound("Delivery not found.");

    var rider = await db.Riders.FindAsync(dto.NewRiderId);
    if (rider == null)
        return Results.NotFound("New rider not found.");
    if (!rider.IsAvailable)
        return Results.BadRequest("New rider is not available.");

    // Mark previous assignment inactive
    var assignments = db.DeliveryAssignments.Where(a => a.DeliveryId == delivery.DeliveryId && a.IsActive);
    foreach (var assignment in assignments)
        assignment.IsActive = false;

    // Assign new rider
    delivery.RiderId = dto.NewRiderId;
    delivery.Status = "Assigned";
    delivery.UpdatedAt = DateTime.UtcNow;

    db.DeliveryAssignments.Add(new DeliveryAssignment
    {
        DeliveryId = delivery.DeliveryId,
        RiderId = rider.RiderId,
        AssignedAt = DateTime.UtcNow,
        IsActive = true
    });
    await db.SaveChangesAsync();
    return Results.Ok("Rider reassigned.");
}).WithName("ReassignDelivery");

// ---------------------------
// Delivery Status Management Endpoints
// ---------------------------

// Update status (Picked-Up → In-Transit → Delivered/Failed)
app.MapPut("/api/deliveries/{orderId}/status", async (int orderId, DeliveryStatusDto dto, ApplicationDbContext db) =>
{
    var delivery = await db.Deliveries.FirstOrDefaultAsync(d => d.OrderId == orderId);
    if (delivery == null)
        return Results.NotFound("Delivery not found.");
    
    var validStatuses = new[] { "PickedUp", "InTransit", "Delivered", "Failed" };
    if (!validStatuses.Contains(dto.Status))
        return Results.BadRequest("Invalid status.");
    
    delivery.Status = dto.Status;
    delivery.UpdatedAt = DateTime.UtcNow;

    db.StatusHistories.Add(new StatusHistory {
        DeliveryId = delivery.DeliveryId,
        Status = dto.Status,
        Timestamp = DateTime.UtcNow,
        ChangedBy = "rider/admin" // Optionally fill from auth system
    });
    await db.SaveChangesAsync();
    return Results.Ok("Delivery status updated.");
}).WithName("UpdateDeliveryStatus");

// Mark delivery as failed with reason
app.MapPut("/api/deliveries/{orderId}/failure", async (int orderId, DeliveryFailureDto dto, ApplicationDbContext db) =>
{
    var delivery = await db.Deliveries.FirstOrDefaultAsync(d => d.OrderId == orderId);
    if (delivery == null)
        return Results.NotFound("Delivery not found.");
    if (string.IsNullOrWhiteSpace(dto.Reason))
        return Results.BadRequest("Failure reason is required.");

    delivery.Status = "Failed";
    delivery.UpdatedAt = DateTime.UtcNow;

    db.DeliveryFailures.Add(new DeliveryFailure {
        DeliveryId = delivery.DeliveryId,
        Reason = dto.Reason,
        Timestamp = DateTime.UtcNow
    });
    db.StatusHistories.Add(new StatusHistory {
        DeliveryId = delivery.DeliveryId,
        Status = "Failed",
        Timestamp = DateTime.UtcNow,
        ChangedBy = "rider/admin"
    });
    await db.SaveChangesAsync();
    return Results.Ok("Delivery marked as failed.");
}).WithName("MarkDeliveryFailed");

// Get delivery progress, ETA & location (simulated)
app.MapGet("/api/deliveries/{orderId}/track", async (int orderId, ApplicationDbContext db) =>
{
    var delivery = await db.Deliveries
        .Include(d => d.Rider)
        .FirstOrDefaultAsync(d => d.OrderId == orderId);
    if (delivery == null)
        return Results.NotFound("Delivery not found.");

    // Simulate ETA & location (customize as needed)
    DateTime? eta = delivery.Status switch
    {
        "Assigned" => DateTime.UtcNow.AddMinutes(30),
        "PickedUp" => DateTime.UtcNow.AddMinutes(20),
        "InTransit" => DateTime.UtcNow.AddMinutes(10),
        "Delivered" or "Failed" => delivery.UpdatedAt,
        _ => null
    };
    var location = delivery.Status == "InTransit" ? "Near recipient address" : "Hub";

    return Results.Ok(new {
        delivery.DeliveryId,
        delivery.Status,
        Eta = eta,
        Location = location
    });
}).WithName("TrackDelivery");

// ---------------------------
// Customer-Facing Delivery Endpoints
// ---------------------------

// View rider contact details
app.MapGet("/api/customers/{orderId}/rider", async (int orderId, ApplicationDbContext db) =>
{
    var delivery = await db.Deliveries.Include(d => d.Rider)
        .FirstOrDefaultAsync(d => d.OrderId == orderId);
    if (delivery == null || delivery.Rider == null)
        return Results.NotFound("No rider assigned or delivery not found.");
    var dto = new CustomerRiderDetailsDto {
        RiderId = delivery.RiderId,
        RiderName = delivery.Rider.Name,
        RiderPhone = delivery.Rider.PhoneNumber
    };
    return Results.Ok(dto);
}).WithName("GetCustomerRiderDetails");

// View estimated arrival time
app.MapGet("/api/customers/{orderId}/eta", async (int orderId, ApplicationDbContext db) =>
{
    var delivery = await db.Deliveries.FirstOrDefaultAsync(d => d.OrderId == orderId);
    if (delivery == null)
        return Results.NotFound("Delivery not found.");
    // Simulate ETA based on status
    DateTime? eta = delivery.Status switch {
        "Assigned" => DateTime.UtcNow.AddMinutes(30),
        "PickedUp" => DateTime.UtcNow.AddMinutes(20),
        "InTransit" => DateTime.UtcNow.AddMinutes(10),
        "Delivered" or "Failed" => delivery.UpdatedAt,
        _ => null
    };
    var dto = new CustomerEtaDto { Eta = eta, Status = delivery.Status };
    return Results.Ok(dto);
}).WithName("GetCustomerEta");

// Submit rider feedback
app.MapPost("/api/customers/{orderId}/feedback", async (int orderId, CustomerFeedbackDto dto, ApplicationDbContext db) =>
{
    if (dto.Rating < 1 || dto.Rating > 5)
        return Results.BadRequest("Rating must be 1-5.");
    var delivery = await db.Deliveries.Include(d => d.Rider)
        .FirstOrDefaultAsync(d => d.OrderId == orderId);
    if (delivery == null || delivery.Rider == null)
        return Results.NotFound("Delivery or rider not found.");
    var feedback = new Feedback {
        DeliveryId = delivery.DeliveryId,
        RiderId = delivery.Rider.RiderId,
        Rating = dto.Rating,
        Comment = dto.Comment,
        CreatedAt = DateTime.UtcNow
    };
    db.Feedbacks.Add(feedback);
    await db.SaveChangesAsync();
    return Results.Ok("Feedback submitted.");
}).WithName("SubmitCustomerFeedback");

// ---------------------------
// Seed Data Endpoint (for testing)
// ---------------------------

app.MapPost("/api/seed", async (ApplicationDbContext db) =>
{
    // Check if data already exists
    if (await db.Users.AnyAsync() || await db.Riders.AnyAsync() || await db.Deliveries.AnyAsync())
    {
        return Results.BadRequest("Database already contains data. Clear existing data first if you want to reseed.");
    }

    // Create Users
    var users = new List<User>
    {
        new User { Name = "John Doe", Email = "john.doe@example.com", PhoneNumber = "123-456-7890" },
        new User { Name = "Jane Smith", Email = "jane.smith@example.com", PhoneNumber = "123-456-7891" },
        new User { Name = "Bob Johnson", Email = "bob.johnson@example.com", PhoneNumber = "123-456-7892" },
        new User { Name = "Alice Williams", Email = "alice.williams@example.com", PhoneNumber = "123-456-7893" }
    };
    db.Users.AddRange(users);
    await db.SaveChangesAsync();

    // Create Riders
    var riders = new List<Rider>
    {
        new Rider { Name = "Mike Rider", Email = "mike.rider@example.com", PhoneNumber = "555-0101", IsAvailable = true },
        new Rider { Name = "Sarah Driver", Email = "sarah.driver@example.com", PhoneNumber = "555-0102", IsAvailable = true },
        new Rider { Name = "Tom Courier", Email = "tom.courier@example.com", PhoneNumber = "555-0103", IsAvailable = false },
        new Rider { Name = "Lisa Delivery", Email = "lisa.delivery@example.com", PhoneNumber = "555-0104", IsAvailable = true }
    };
    db.Riders.AddRange(riders);
    await db.SaveChangesAsync();

    // Create Deliveries with various statuses
    var deliveries = new List<Delivery>
    {
        // Pending delivery (no rider assigned)
        new Delivery 
        { 
            OrderId = 1001, 
            UserId = users[0].UserId, 
            Status = "Pending", 
            CreatedAt = DateTime.UtcNow.AddHours(-2),
            UpdatedAt = DateTime.UtcNow.AddHours(-2)
        },
        // Assigned delivery
        new Delivery 
        { 
            OrderId = 1002, 
            UserId = users[1].UserId, 
            RiderId = riders[0].RiderId,
            Status = "Assigned", 
            CreatedAt = DateTime.UtcNow.AddHours(-1),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-30)
        },
        // Picked up delivery
        new Delivery 
        { 
            OrderId = 1003, 
            UserId = users[2].UserId, 
            RiderId = riders[1].RiderId,
            Status = "PickedUp", 
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-15)
        },
        // In transit delivery
        new Delivery 
        { 
            OrderId = 1004, 
            UserId = users[3].UserId, 
            RiderId = riders[0].RiderId,
            Status = "InTransit", 
            CreatedAt = DateTime.UtcNow.AddHours(-4),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-5)
        },
        // Delivered delivery
        new Delivery 
        { 
            OrderId = 1005, 
            UserId = users[0].UserId, 
            RiderId = riders[1].RiderId,
            Status = "Delivered", 
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1).AddHours(2)
        },
        // Failed delivery
        new Delivery 
        { 
            OrderId = 1006, 
            UserId = users[1].UserId, 
            RiderId = riders[3].RiderId,
            Status = "Failed", 
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-2).AddHours(1)
        }
    };
    db.Deliveries.AddRange(deliveries);
    await db.SaveChangesAsync();

    // Create Delivery Assignments for assigned deliveries
    var assignments = new List<DeliveryAssignment>
    {
        new DeliveryAssignment 
        { 
            DeliveryId = deliveries[1].DeliveryId, 
            RiderId = riders[0].RiderId, 
            AssignedAt = DateTime.UtcNow.AddHours(-1), 
            IsActive = true 
        },
        new DeliveryAssignment 
        { 
            DeliveryId = deliveries[2].DeliveryId, 
            RiderId = riders[1].RiderId, 
            AssignedAt = DateTime.UtcNow.AddHours(-3), 
            IsActive = true 
        },
        new DeliveryAssignment 
        { 
            DeliveryId = deliveries[3].DeliveryId, 
            RiderId = riders[0].RiderId, 
            AssignedAt = DateTime.UtcNow.AddHours(-4), 
            IsActive = true 
        },
        new DeliveryAssignment 
        { 
            DeliveryId = deliveries[4].DeliveryId, 
            RiderId = riders[1].RiderId, 
            AssignedAt = DateTime.UtcNow.AddDays(-1), 
            IsActive = false 
        },
        new DeliveryAssignment 
        { 
            DeliveryId = deliveries[5].DeliveryId, 
            RiderId = riders[3].RiderId, 
            AssignedAt = DateTime.UtcNow.AddDays(-2), 
            IsActive = false 
        }
    };
    db.DeliveryAssignments.AddRange(assignments);
    await db.SaveChangesAsync();

    // Create Status Histories
    var statusHistories = new List<StatusHistory>
    {
        new StatusHistory { DeliveryId = deliveries[1].DeliveryId, Status = "Pending", Timestamp = DateTime.UtcNow.AddHours(-1), ChangedBy = "system" },
        new StatusHistory { DeliveryId = deliveries[1].DeliveryId, Status = "Assigned", Timestamp = DateTime.UtcNow.AddMinutes(-30), ChangedBy = "admin" },
        new StatusHistory { DeliveryId = deliveries[2].DeliveryId, Status = "Pending", Timestamp = DateTime.UtcNow.AddHours(-3), ChangedBy = "system" },
        new StatusHistory { DeliveryId = deliveries[2].DeliveryId, Status = "Assigned", Timestamp = DateTime.UtcNow.AddHours(-2), ChangedBy = "admin" },
        new StatusHistory { DeliveryId = deliveries[2].DeliveryId, Status = "PickedUp", Timestamp = DateTime.UtcNow.AddMinutes(-15), ChangedBy = "rider" },
        new StatusHistory { DeliveryId = deliveries[3].DeliveryId, Status = "Pending", Timestamp = DateTime.UtcNow.AddHours(-4), ChangedBy = "system" },
        new StatusHistory { DeliveryId = deliveries[3].DeliveryId, Status = "Assigned", Timestamp = DateTime.UtcNow.AddHours(-3), ChangedBy = "admin" },
        new StatusHistory { DeliveryId = deliveries[3].DeliveryId, Status = "PickedUp", Timestamp = DateTime.UtcNow.AddHours(-2), ChangedBy = "rider" },
        new StatusHistory { DeliveryId = deliveries[3].DeliveryId, Status = "InTransit", Timestamp = DateTime.UtcNow.AddMinutes(-5), ChangedBy = "rider" }
    };
    db.StatusHistories.AddRange(statusHistories);
    await db.SaveChangesAsync();

    // Create a Delivery Failure for the failed delivery
    var failure = new DeliveryFailure
    {
        DeliveryId = deliveries[5].DeliveryId,
        Reason = "Customer address not found",
        Timestamp = DateTime.UtcNow.AddDays(-2).AddHours(1)
    };
    db.DeliveryFailures.Add(failure);
    await db.SaveChangesAsync();

    // Create some Feedback
    var feedbacks = new List<Feedback>
    {
        new Feedback 
        { 
            DeliveryId = deliveries[4].DeliveryId, 
            RiderId = riders[1].RiderId, 
            Rating = 5, 
            Comment = "Excellent service! Very fast delivery.", 
            CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(3) 
        },
        new Feedback 
        { 
            DeliveryId = deliveries[4].DeliveryId, 
            RiderId = riders[1].RiderId, 
            Rating = 4, 
            Comment = "Good service, arrived on time.", 
            CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(4) 
        }
    };
    db.Feedbacks.AddRange(feedbacks);
    await db.SaveChangesAsync();

    return Results.Ok(new 
    { 
        message = "Test data seeded successfully!",
        users = users.Count,
        riders = riders.Count,
        deliveries = deliveries.Count,
        assignments = assignments.Count,
        statusHistories = statusHistories.Count,
        failures = 1,
        feedbacks = feedbacks.Count
    });
}).WithName("SeedTestData");

// ---------------------------
// View Database Data Endpoint
// ---------------------------

app.MapGet("/api/database/view", async (ApplicationDbContext db) =>
{
    var users = await db.Users.ToListAsync();
    var riders = await db.Riders.ToListAsync();
    var deliveries = await db.Deliveries
        .Include(d => d.Rider)
        .Include(d => d.User)
        .ToListAsync();
    var assignments = await db.DeliveryAssignments
        .Include(a => a.Rider)
        .Include(a => a.Delivery)
        .ToListAsync();
    var statusHistories = await db.StatusHistories
        .Include(s => s.Delivery)
        .OrderBy(s => s.Timestamp)
        .ToListAsync();
    var failures = await db.DeliveryFailures
        .Include(f => f.Delivery)
        .ToListAsync();
    var feedbacks = await db.Feedbacks
        .Include(f => f.Rider)
        .Include(f => f.Delivery)
        .ToListAsync();

    return Results.Ok(new
    {
        users = users.Select(u => new { u.UserId, u.Name, u.Email, u.PhoneNumber }),
        riders = riders.Select(r => new { r.RiderId, r.Name, r.Email, r.PhoneNumber, r.IsAvailable }),
        deliveries = deliveries.Select(d => new 
        { 
            d.DeliveryId, 
            d.OrderId, 
            d.Status, 
            RiderName = d.Rider?.Name,
            UserName = d.User?.Name,
            d.CreatedAt, 
            d.UpdatedAt 
        }),
        assignments = assignments.Select(a => new 
        { 
            a.AssignmentId, 
            OrderId = a.Delivery?.OrderId,
            RiderName = a.Rider?.Name,
            a.AssignedAt, 
            a.IsActive 
        }),
        statusHistories = statusHistories.Select(s => new 
        { 
            s.HistoryId, 
            OrderId = s.Delivery?.OrderId,
            s.Status, 
            s.Timestamp, 
            s.ChangedBy 
        }),
        failures = failures.Select(f => new 
        { 
            f.FailureId, 
            OrderId = f.Delivery?.OrderId,
            f.Reason, 
            f.Timestamp 
        }),
        feedbacks = feedbacks.Select(f => new 
        { 
            f.FeedbackId, 
            OrderId = f.Delivery?.OrderId,
            RiderName = f.Rider?.Name,
            f.Rating, 
            f.Comment, 
            f.CreatedAt 
        }),
        summary = new
        {
            totalUsers = users.Count,
            totalRiders = riders.Count,
            totalDeliveries = deliveries.Count,
            totalAssignments = assignments.Count,
            totalStatusHistories = statusHistories.Count,
            totalFailures = failures.Count,
            totalFeedbacks = feedbacks.Count
        }
    });
}).WithName("ViewDatabaseData");

// ---------------------------
// Run the App
// ---------------------------

app.Run();
