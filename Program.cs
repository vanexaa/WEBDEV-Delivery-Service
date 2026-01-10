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

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5174")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

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

// CORS
app.UseCors();

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

    var rider = await db.Riders
        .Include(r => r.Deliveries)
        .FirstOrDefaultAsync(r => r.RiderId == dto.RiderId);
    
    if (rider == null)
        return Results.NotFound("Rider not found.");
    
    // Check if rider is blocked
    var isBlocked = rider.BlockedUntil.HasValue && rider.BlockedUntil.Value > DateTime.UtcNow;
    if (isBlocked)
        return Results.BadRequest($"Rider is blocked until {rider.BlockedUntil.Value:yyyy-MM-dd HH:mm:ss} UTC.");
    
    if (!rider.IsAvailable)
        return Results.BadRequest("Rider is not available.");
    
    // Check capacity
    var ongoingStatuses = new[] { "Assigned", "PickedUp", "InTransit" };
    var currentLoad = rider.Deliveries.Count(d => ongoingStatuses.Contains(d.Status));
    var capacity = rider.Capacity > 0 ? rider.Capacity : 5;
    
    if (currentLoad >= capacity)
        return Results.BadRequest($"Rider is at maximum capacity ({currentLoad}/{capacity}).");

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

    var rider = await db.Riders
        .Include(r => r.Deliveries)
        .FirstOrDefaultAsync(r => r.RiderId == dto.NewRiderId);
    
    if (rider == null)
        return Results.NotFound("New rider not found.");
    
    // Check if rider is blocked
    var isBlocked = rider.BlockedUntil.HasValue && rider.BlockedUntil.Value > DateTime.UtcNow;
    if (isBlocked)
        return Results.BadRequest($"Rider is blocked until {rider.BlockedUntil.Value:yyyy-MM-dd HH:mm:ss} UTC.");
    
    if (!rider.IsAvailable)
        return Results.BadRequest("New rider is not available.");
    
    // Check capacity
    var ongoingStatuses = new[] { "Assigned", "PickedUp", "InTransit" };
    var currentLoad = rider.Deliveries.Count(d => ongoingStatuses.Contains(d.Status));
    var capacity = rider.Capacity > 0 ? rider.Capacity : 5;
    
    if (currentLoad >= capacity)
        return Results.BadRequest($"New rider is at maximum capacity ({currentLoad}/{capacity}).");

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
// Rider-Facing Endpoints
// ---------------------------

// Get rider profile/details
app.MapGet("/api/riders/{riderId}", async (int riderId, ApplicationDbContext db) =>
{
    var rider = await db.Riders
        .Include(r => r.Deliveries)
        .Include(r => r.Feedbacks)
        .FirstOrDefaultAsync(r => r.RiderId == riderId);
    
    if (rider == null)
        return Results.NotFound("Rider not found.");
    
    var ongoingStatuses = new[] { "Assigned", "PickedUp", "InTransit" };
    var currentLoad = rider.Deliveries.Count(d => ongoingStatuses.Contains(d.Status));
    var capacity = rider.Capacity > 0 ? rider.Capacity : 5; // Use rider's capacity or default
    var loadPercentage = capacity > 0 ? (currentLoad / (double)capacity) * 100 : 0;
    
    // Calculate average rating
    var ratingAvg = rider.Feedbacks.Any() 
        ? rider.Feedbacks.Average(f => f.Rating) 
        : 0.0;
    
    // Determine availability status
    var isBlocked = rider.BlockedUntil.HasValue && rider.BlockedUntil.Value > DateTime.UtcNow;
    var availabilityStatus = isBlocked 
        ? "Blocked" 
        : rider.IsAvailable 
            ? "Available" 
            : "Unavailable";
    
    var canAcceptMore = !isBlocked && rider.IsAvailable && currentLoad < capacity;
    
    var dto = new RiderProfileDto
    {
        RiderId = rider.RiderId,
        Name = rider.Name,
        Email = rider.Email,
        PhoneNumber = rider.PhoneNumber,
        VehicleType = rider.VehicleType,
        Capacity = capacity,
        AvailabilityStatus = availabilityStatus,
        CurrentLoad = currentLoad,
        RatingAvg = Math.Round(ratingAvg, 2),
        BlockedUntil = rider.BlockedUntil,
        CreatedAt = rider.CreatedAt,
        UpdatedAt = rider.UpdatedAt,
        LoadPercentage = Math.Round(loadPercentage, 1),
        CanAcceptMore = canAcceptMore
    };
    
    return Results.Ok(dto);
}).WithName("GetRiderProfile");

// Get assigned orders for a rider
app.MapGet("/api/riders/{riderId}/orders", async (int riderId, ApplicationDbContext db) =>
{
    var ongoingStatuses = new[] { "Assigned", "PickedUp", "InTransit" };
    
    var deliveries = await db.Deliveries
        .Include(d => d.User)
        .Where(d => d.RiderId == riderId && ongoingStatuses.Contains(d.Status))
        .OrderByDescending(d => d.CreatedAt)
        .Select(d => new RiderOrderDto
        {
            DeliveryId = d.DeliveryId,
            OrderId = d.OrderId,
            Status = d.Status,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt,
            CustomerName = d.User.Name,
            CustomerPhone = d.User.PhoneNumber,
            Eta = null // Will be set below
        })
        .ToListAsync();
    
    deliveries.ForEach(d =>
    {
        d.Eta = d.Status switch
        {
            "Assigned" => DateTime.UtcNow.AddMinutes(30),
            "PickedUp" => DateTime.UtcNow.AddMinutes(20),
            "InTransit" => DateTime.UtcNow.AddMinutes(10),
            _ => null
        };
    });

    // Also return rider's current load information
    var rider = await db.Riders
        .Include(r => r.Deliveries)
        .FirstOrDefaultAsync(r => r.RiderId == riderId);
    
    var currentLoad = rider != null ? rider.Deliveries.Count(d => ongoingStatuses.Contains(d.Status)) : 0;
    var capacity = rider != null && rider.Capacity > 0 ? rider.Capacity : 5;
    var loadPercentage = capacity > 0 ? (currentLoad / (double)capacity) * 100 : 0;
    var isBlocked = rider != null && rider.BlockedUntil.HasValue && rider.BlockedUntil.Value > DateTime.UtcNow;
    var availabilityStatus = isBlocked 
        ? "Blocked" 
        : rider?.IsAvailable == true 
            ? "Available" 
            : "Unavailable";
    
    return Results.Ok(new
    {
        Orders = deliveries,
        LoadInfo = new
        {
            CurrentLoad = currentLoad,
            Capacity = capacity,
            LoadPercentage = Math.Round(loadPercentage, 1),
            AvailabilityStatus = availabilityStatus,
            IsAvailable = rider?.IsAvailable ?? false,
            CanAcceptMore = !isBlocked && (rider?.IsAvailable ?? false) && currentLoad < capacity
        }
    });
}).WithName("GetRiderOrders");

// Update rider availability
app.MapPut("/api/riders/{riderId}/availability", async (int riderId, RiderAvailabilityDto dto, ApplicationDbContext db) =>
{
    var rider = await db.Riders
        .Include(r => r.Deliveries)
        .FirstOrDefaultAsync(r => r.RiderId == riderId);
    
    if (rider == null)
        return Results.NotFound("Rider not found.");
    
    // Check load if trying to set unavailable while having active deliveries
    var ongoingStatuses = new[] { "Assigned", "PickedUp", "InTransit" };
    var currentLoad = rider.Deliveries.Count(d => ongoingStatuses.Contains(d.Status));
    
    // If setting to unavailable, warn if there are active deliveries (but allow it)
    if (!dto.IsAvailable && currentLoad > 0)
    {
        // Allow but return warning
        rider.IsAvailable = false;
        await db.SaveChangesAsync();
        return Results.Ok(new 
        { 
            message = "Availability updated. Warning: You have active deliveries.", 
            isAvailable = rider.IsAvailable,
            activeDeliveries = currentLoad
        });
    }
    
    rider.IsAvailable = dto.IsAvailable;
    await db.SaveChangesAsync();
    
    // Calculate load info for response
    var capacity = rider.Capacity > 0 ? rider.Capacity : 5;
    var loadPercentage = capacity > 0 ? (currentLoad / (double)capacity) * 100 : 0;
    var isBlocked = rider.BlockedUntil.HasValue && rider.BlockedUntil.Value > DateTime.UtcNow;
    var availabilityStatus = isBlocked 
        ? "Blocked" 
        : rider.IsAvailable 
            ? "Available" 
            : "Unavailable";
    
    return Results.Ok(new 
    { 
        message = "Availability updated.", 
        isAvailable = rider.IsAvailable,
        availabilityStatus = availabilityStatus,
        currentLoad = currentLoad,
        capacity = capacity,
        loadPercentage = Math.Round(loadPercentage, 1),
        canAcceptMore = !isBlocked && rider.IsAvailable && currentLoad < capacity
    });
}).WithName("UpdateRiderAvailability");

// Get delivery history for a rider
app.MapGet("/api/riders/{riderId}/history", async (int riderId, ApplicationDbContext db) =>
{
    var deliveries = await db.Deliveries
        .Include(d => d.User)
        .Include(d => d.Feedbacks)
        .Where(d => d.RiderId == riderId && 
                   (d.Status == "Delivered" || d.Status == "Failed"))
        .OrderByDescending(d => d.UpdatedAt)
        .ToListAsync();
    
    var history = deliveries.Select(d => 
    {
        var latestFeedback = d.Feedbacks.OrderByDescending(f => f.CreatedAt).FirstOrDefault();
        return new RiderHistoryOrderDto
        {
            DeliveryId = d.DeliveryId,
            OrderId = d.OrderId,
            Status = d.Status,
            DeliveredAt = d.UpdatedAt,
            CustomerName = d.User.Name,
            Rating = latestFeedback?.Rating,
            Feedback = latestFeedback?.Comment
        };
    }).ToList();
    
    return Results.Ok(history);
}).WithName("GetRiderHistory");

// Get feedback summary for a rider
app.MapGet("/api/riders/{riderId}/feedback", async (int riderId, ApplicationDbContext db) =>
{
    var feedbacks = await db.Feedbacks
        .Where(f => f.RiderId == riderId)
        .OrderByDescending(f => f.CreatedAt)
        .ToListAsync();
    
    if (!feedbacks.Any())
    {
        return Results.Ok(new RiderFeedbackSummaryDto
        {
            AverageRating = 0,
            Feedbacks = new List<FeedbackResponseDto>()
        });
    }
    
    var averageRating = feedbacks.Average(f => f.Rating);
    var feedbackDtos = feedbacks.Select(f => new FeedbackResponseDto
    {
        FeedbackId = f.FeedbackId,
        Rating = f.Rating,
        Comment = f.Comment,
        CreatedAt = f.CreatedAt
    }).ToList();
    
    return Results.Ok(new RiderFeedbackSummaryDto
    {
        AverageRating = Math.Round(averageRating, 2),
        Feedbacks = feedbackDtos
    });
}).WithName("GetRiderFeedback");

// Get detailed order information for rider
app.MapGet("/api/riders/{riderId}/orders/{orderId}", async (int riderId, int orderId, ApplicationDbContext db) =>
{
    var delivery = await db.Deliveries
        .Include(d => d.User)
        .Include(d => d.Rider)
        .FirstOrDefaultAsync(d => d.OrderId == orderId && d.RiderId == riderId);
    
    if (delivery == null)
        return Results.NotFound("Order not found or not assigned to this rider.");
    
    var dto = new DeliveryDetailsDto
    {
        DeliveryId = delivery.DeliveryId,
        OrderId = delivery.OrderId,
        RiderId = delivery.RiderId,
        RiderName = delivery.Rider?.Name,
        Status = delivery.Status,
        CreatedAt = delivery.CreatedAt,
        UpdatedAt = delivery.UpdatedAt,
        CustomerAddress = null, // Add if you have address in User or Delivery model
        Eta = delivery.Status switch
        {
            "Assigned" => DateTime.UtcNow.AddMinutes(30),
            "PickedUp" => DateTime.UtcNow.AddMinutes(20),
            "InTransit" => DateTime.UtcNow.AddMinutes(10),
            _ => null
        }
    };
    
    return Results.Ok(dto);
}).WithName("GetRiderOrderDetails");

// ---------------------------
// Admin-Facing Endpoints
// ---------------------------

// Get all deliveries for admin monitoring
app.MapGet("/api/admin/deliveries", async (string? status, ApplicationDbContext db) =>
{
    var query = db.Deliveries
        .Include(d => d.User)
        .Include(d => d.Rider)
        .AsQueryable();
    
    // Filter by status if provided
    if (!string.IsNullOrEmpty(status) && status != "All")
    {
        query = query.Where(d => d.Status == status);
    }
    
    var deliveries = await query
        .OrderByDescending(d => d.CreatedAt)
        .Select(d => new AdminDeliveryDto
        {
            DeliveryId = d.DeliveryId,
            OrderId = d.OrderId,
            Status = d.Status,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt,
            CustomerName = d.User.Name,
            CustomerPhone = d.User.PhoneNumber,
            RiderName = d.Rider != null ? d.Rider.Name : null,
            RiderId = d.RiderId,
            RiderPhone = d.Rider != null ? d.Rider.PhoneNumber : null,
            Eta = null // Will be set below
        })
        .ToListAsync();
    
    deliveries.ForEach(d =>
    {
        d.Eta = CalculateEta(d.Status);
    });


    static DateTime? CalculateEta(string status) //helper method
    {
        return status switch
        {
            "Assigned"  => DateTime.UtcNow.AddMinutes(30),
            "PickedUp"  => DateTime.UtcNow.AddMinutes(20),
            "InTransit" => DateTime.UtcNow.AddMinutes(10),
            _ => null
        };
    }

    return Results.Ok(deliveries);
}).WithName("GetAdminDeliveries");

// Get all riders for admin (for reassignment dropdown)
app.MapGet("/api/admin/riders", async (ApplicationDbContext db) =>
{
    var riders = await db.Riders
        .OrderBy(r => r.Name)
        .Select(r => new
        {
            r.RiderId,
            r.Name,
            r.Email,
            r.PhoneNumber,
            r.IsAvailable
        })
        .ToListAsync();
    
    return Results.Ok(riders);
}).WithName("GetAllRiders");

// Get all riders with load information
app.MapGet("/api/admin/riders/load", async (ApplicationDbContext db) =>
{
    var ongoingStatuses = new[] { "Assigned", "PickedUp", "InTransit" };
    
    var riders = await db.Riders
        .Include(r => r.Deliveries)
        .Include(r => r.Feedbacks)
        .OrderBy(r => r.Name)
        .ToListAsync();
    
    var ridersWithLoad = riders.Select(r => 
    {
        var currentLoad = r.Deliveries.Count(d => ongoingStatuses.Contains(d.Status));
        var capacity = r.Capacity > 0 ? r.Capacity : 5;
        var loadPercentage = capacity > 0 ? (currentLoad / (double)capacity) * 100 : 0;
        var isBlocked = r.BlockedUntil.HasValue && r.BlockedUntil.Value > DateTime.UtcNow;
        var availabilityStatus = isBlocked 
            ? "Blocked" 
            : r.IsAvailable 
                ? "Available" 
                : "Unavailable";
        var ratingAvg = r.Feedbacks.Any() 
            ? r.Feedbacks.Average(f => f.Rating) 
            : 0.0;
        
        return new RiderLoadDto
        {
            RiderId = r.RiderId,
            Name = r.Name,
            Email = r.Email,
            PhoneNumber = r.PhoneNumber,
            VehicleType = r.VehicleType,
            Capacity = capacity,
            AvailabilityStatus = availabilityStatus,
            IsAvailable = r.IsAvailable,
            CurrentLoad = currentLoad,
            RatingAvg = Math.Round(ratingAvg, 2),
            BlockedUntil = r.BlockedUntil,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            LoadPercentage = Math.Round(loadPercentage, 1)
        };
    }).ToList();
    
    return Results.Ok(ridersWithLoad);
}).WithName("GetRidersWithLoad");

// Get rider load (current active deliveries count)
app.MapGet("/api/riders/{riderId}/load", async (int riderId, ApplicationDbContext db) =>
{
    var rider = await db.Riders
        .Include(r => r.Deliveries)
        .FirstOrDefaultAsync(r => r.RiderId == riderId);
    
    if (rider == null)
        return Results.NotFound("Rider not found.");
    
    var ongoingStatuses = new[] { "Assigned", "PickedUp", "InTransit" };
    var currentLoad = rider.Deliveries.Count(d => ongoingStatuses.Contains(d.Status));
    var capacity = rider.Capacity > 0 ? rider.Capacity : 5;
    var loadPercentage = capacity > 0 ? (currentLoad / (double)capacity) * 100 : 0;
    var isBlocked = rider.BlockedUntil.HasValue && rider.BlockedUntil.Value > DateTime.UtcNow;
    var availabilityStatus = isBlocked 
        ? "Blocked" 
        : rider.IsAvailable 
            ? "Available" 
            : "Unavailable";
    
    return Results.Ok(new
    {
        RiderId = rider.RiderId,
        CurrentLoad = currentLoad,
        Capacity = capacity,
        LoadPercentage = Math.Round(loadPercentage, 1),
        AvailabilityStatus = availabilityStatus,
        IsAvailable = rider.IsAvailable,
        IsBlocked = isBlocked,
        BlockedUntil = rider.BlockedUntil,
        CanAcceptMore = !isBlocked && rider.IsAvailable && currentLoad < capacity
    });
}).WithName("GetRiderLoad");

// Auto-assign delivery to least loaded available rider
app.MapPost("/api/deliveries/auto-assign", async (int orderId, ApplicationDbContext db) =>
{
    var delivery = await db.Deliveries.FirstOrDefaultAsync(d => d.OrderId == orderId);
    if (delivery == null)
        return Results.NotFound("Delivery not found.");
    
    if (delivery.RiderId != null)
        return Results.BadRequest("Delivery already has a rider assigned.");
    
    var ongoingStatuses = new[] { "Assigned", "PickedUp", "InTransit" };
    
    // Get all available riders with their current load
    var riders = await db.Riders
        .Include(r => r.Deliveries)
        .Where(r => r.IsAvailable)
        .ToListAsync();
    
    if (!riders.Any())
        return Results.BadRequest("No available riders.");
    
    // Filter out blocked riders and find riders with capacity
    var now = DateTime.UtcNow;
    var ridersWithCapacity = riders
        .Select(r => new
        {
            Rider = r,
            CurrentLoad = r.Deliveries.Count(d => ongoingStatuses.Contains(d.Status)),
            Capacity = r.Capacity > 0 ? r.Capacity : 5,
            IsBlocked = r.BlockedUntil.HasValue && r.BlockedUntil.Value > now
        })
        .Where(r => !r.IsBlocked && r.CurrentLoad < r.Capacity)
        .OrderBy(r => r.CurrentLoad) // Least loaded first
        .ThenBy(r => r.Rider.Name) // Then by name for consistency
        .ToList();
    
    if (!ridersWithCapacity.Any())
        return Results.BadRequest("All available riders are at maximum capacity or blocked.");
    
    // Assign to least loaded rider
    var selectedRider = ridersWithCapacity.First().Rider;
    delivery.RiderId = selectedRider.RiderId;
    delivery.Status = "Assigned";
    delivery.UpdatedAt = DateTime.UtcNow;
    
    db.DeliveryAssignments.Add(new DeliveryAssignment
    {
        DeliveryId = delivery.DeliveryId,
        RiderId = selectedRider.RiderId,
        AssignedAt = DateTime.UtcNow,
        IsActive = true
    });
    
    await db.SaveChangesAsync();
    
    return Results.Ok(new
    {
        message = "Rider assigned successfully.",
        riderId = selectedRider.RiderId,
        riderName = selectedRider.Name,
        currentLoad = ridersWithCapacity.First().CurrentLoad + 1,
        capacity = ridersWithCapacity.First().Capacity
    });
}).WithName("AutoAssignDelivery");

// Get failed deliveries
app.MapGet("/api/admin/deliveries/failed", async (ApplicationDbContext db) =>
{
    var failedDeliveries = await db.Deliveries
        .Include(d => d.User)
        .Include(d => d.Rider)
        .Include(d => d.DeliveryFailures)
        .Where(d => d.Status == "Failed")
        .OrderByDescending(d => d.UpdatedAt)
        .Select(d => new
        {
            DeliveryId = d.DeliveryId,
            OrderId = d.OrderId,
            CustomerName = d.User.Name,
            CustomerPhone = d.User.PhoneNumber,
            RiderName = d.Rider != null ? d.Rider.Name : null,
            FailedAt = d.UpdatedAt,
            FailureReason = d.DeliveryFailures.OrderByDescending(f => f.Timestamp).FirstOrDefault() != null
                ? d.DeliveryFailures.OrderByDescending(f => f.Timestamp).FirstOrDefault()!.Reason
                : "No reason provided"
        })
        .ToListAsync();
    
    return Results.Ok(failedDeliveries);
}).WithName("GetFailedDeliveries");

// Get delivery details for admin (with full info)
app.MapGet("/api/admin/deliveries/{orderId}", async (int orderId, ApplicationDbContext db) =>
{
    var delivery = await db.Deliveries
        .Include(d => d.User)
        .Include(d => d.Rider)
        .Include(d => d.DeliveryFailures)
        .Include(d => d.StatusHistories)
        .FirstOrDefaultAsync(d => d.OrderId == orderId);
    
    if (delivery == null)
        return Results.NotFound("Delivery not found.");
    
    var dto = new
    {
        DeliveryId = delivery.DeliveryId,
        OrderId = delivery.OrderId,
        Status = delivery.Status,
        CreatedAt = delivery.CreatedAt,
        UpdatedAt = delivery.UpdatedAt,
        Customer = new
        {
            Name = delivery.User.Name,
            Email = delivery.User.Email,
            PhoneNumber = delivery.User.PhoneNumber
        },
        Rider = delivery.Rider != null ? new
        {
            RiderId = delivery.Rider.RiderId,
            Name = delivery.Rider.Name,
            Email = delivery.Rider.Email,
            PhoneNumber = delivery.Rider.PhoneNumber,
            IsAvailable = delivery.Rider.IsAvailable
        } : null,
        FailureReason = delivery.DeliveryFailures.OrderByDescending(f => f.Timestamp).FirstOrDefault() != null
            ? delivery.DeliveryFailures.OrderByDescending(f => f.Timestamp).FirstOrDefault()!.Reason
            : null,
        StatusHistory = delivery.StatusHistories
            .OrderByDescending(s => s.Timestamp)
            .Select(s => new
            {
                s.Status,
                s.Timestamp,
                s.ChangedBy
            })
            .ToList(),
        Eta = delivery.Status switch
        {
            "Assigned" => DateTime.UtcNow.AddMinutes(30),
            "PickedUp" => DateTime.UtcNow.AddMinutes(20),
            "InTransit" => DateTime.UtcNow.AddMinutes(10),
            _ => (DateTime?)null
        }
    };
    
    return Results.Ok(dto);
}).WithName("GetAdminDeliveryDetails");

// ---------------------------
// Run the App
// ---------------------------

app.Run();