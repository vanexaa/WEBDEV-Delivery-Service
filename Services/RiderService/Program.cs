using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using RiderService.Data;
using RiderService.Models;
using RiderService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Database=RiderServiceDB;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<RiderDbContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    });
});


// Register application services
builder.Services.AddScoped<IRiderService, RiderService.Services.RiderService>();

// Configure Swagger/OpenAPI
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Rider Service API", 
        Version = "v1",
        Description = "Rider management service for the Delivery Management System"
    });
});

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Initialize database and seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<RiderDbContext>();
        context.Database.EnsureCreated();
        
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Database initialized successfully");
        
        // Seed mock data if database is empty
        var riderCount = context.Riders.Count();
        if (riderCount == 0)
        {
            logger.LogInformation("Database is empty. Seeding mock rider data...");
            SeedMockData(context);
            logger.LogInformation("Mock rider data seeded successfully");
        }
        else
        {
            logger.LogInformation($"Database already contains {riderCount} riders. Skipping seed.");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database.");
    }
}

// Seed mock data function
static void SeedMockData(RiderDbContext context)
{
    var riders = new List<Rider>
    {
        new Rider
        {
            UserId = 2, // Assuming rider1 user ID from AuthService
            FullName = "John Rider",
            PhoneNumber = "+1234567890",
            Email = "john.rider@example.com",
            VehicleType = "Motorcycle",
            VehicleNumber = "MC-1234",
            LicenseNumber = "DL-001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        },
        new Rider
        {
            UserId = 3, // Assuming rider2 user ID
            FullName = "Sarah Driver",
            PhoneNumber = "+1234567891",
            Email = "sarah.driver@example.com",
            VehicleType = "Bicycle",
            VehicleNumber = "BC-5678",
            LicenseNumber = "DL-002",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        },
        new Rider
        {
            UserId = 4,
            FullName = "Mike Courier",
            PhoneNumber = "+1234567892",
            Email = "mike.courier@example.com",
            VehicleType = "Motorcycle",
            VehicleNumber = "MC-9012",
            LicenseNumber = "DL-003",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        },
        new Rider
        {
            UserId = 5,
            FullName = "Emma Delivery",
            PhoneNumber = "+1234567893",
            Email = "emma.delivery@example.com",
            VehicleType = "Bicycle",
            VehicleNumber = "BC-3456",
            LicenseNumber = "DL-004",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        },
        new Rider
        {
            UserId = 6,
            FullName = "Alex Transport",
            PhoneNumber = "+1234567894",
            Email = "alex.transport@example.com",
            VehicleType = "Motorcycle",
            VehicleNumber = "MC-7890",
            LicenseNumber = "DL-005",
            IsActive = false, // Inactive rider for testing
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }
    };

    context.Riders.AddRange(riders);
    context.SaveChanges();

    // Add availability data for some riders
    var availability = new List<RiderAvailability>
    {
        new RiderAvailability
        {
            RiderId = 1, // John Rider
            IsOnline = true,
            CurrentLatitude = 40.7128m,
            CurrentLongitude = -74.0060m,
            LastSeen = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        },
        new RiderAvailability
        {
            RiderId = 2, // Sarah Driver
            IsOnline = true,
            CurrentLatitude = 40.7580m,
            CurrentLongitude = -73.9855m,
            LastSeen = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        },
        new RiderAvailability
        {
            RiderId = 3, // Mike Courier
            IsOnline = false,
            CurrentLatitude = 40.7505m,
            CurrentLongitude = -73.9934m,
            LastSeen = DateTime.UtcNow.AddMinutes(-30),
            UpdatedAt = DateTime.UtcNow
        },
        new RiderAvailability
        {
            RiderId = 4, // Emma Delivery
            IsOnline = true,
            CurrentLatitude = 40.7282m,
            CurrentLongitude = -73.9942m,
            LastSeen = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }
    };

    context.RiderAvailability.AddRange(availability);
    context.SaveChanges();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Rider Service API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.MapControllers();

app.Run();
