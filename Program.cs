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
// Minimal API Endpoint
// ---------------------------

app.MapGet("/weatherforecast", () =>
{
    var summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild",
        "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast(
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();

    return forecast;
})
.WithName("GetWeatherForecast");

// ---------------------------
// Run the App
// ---------------------------

app.Run();

// ---------------------------
// Record for Forecast
// ---------------------------

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
