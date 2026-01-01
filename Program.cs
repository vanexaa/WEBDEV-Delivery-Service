using Microsoft.EntityFrameworkCore;
using Ayawkomagbackend.Data;

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

using Ayawkomagbackend.DTOs;
using Ayawkomagbackend.Models;

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
