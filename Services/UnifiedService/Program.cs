/*
 * UnifiedService - Single Port Architecture
 * 
 * This service consolidates all microservices (Auth, Delivery, Rider, Order, Customer)
 * into a single backend application running on port 5000.
 * 
 * Benefits:
 * - Simpler deployment: One service instead of five
 * - One port to manage (5000)
 * - Easier to start/stop
 * - No API Gateway needed
 * - Faster startup and easier debugging
 * - Still organized: Controllers separated by domain, each with own database
 * 
 * All frontend apps connect to http://localhost:5000/api/*
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

// Import all namespaces
using AuthService.Data;
using AuthService.Services;
using DeliveryService.Data;
using DeliveryService.Services;
using RiderService.Data;
using RiderService.Services;
using OrderService.Data;
using OrderService.Services;
using CustomerService.Data;
using CustomerService.Services;
using UnifiedService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
    });
builder.Services.AddEndpointsApiExplorer();

// Configure all Databases
var authConnectionString = builder.Configuration.GetConnectionString("AuthConnection") 
    ?? "Server=localhost;Database=AuthServiceDB;Trusted_Connection=True;TrustServerCertificate=True;";
var deliveryConnectionString = builder.Configuration.GetConnectionString("DeliveryConnection") 
    ?? "Server=localhost;Database=DeliveryServiceDB;Trusted_Connection=True;TrustServerCertificate=True;";
var riderConnectionString = builder.Configuration.GetConnectionString("RiderConnection") 
    ?? "Server=localhost;Database=RiderServiceDB;Trusted_Connection=True;TrustServerCertificate=True;";
var orderConnectionString = builder.Configuration.GetConnectionString("OrderConnection") 
    ?? "Server=localhost;Database=OrderServiceDB;Trusted_Connection=True;TrustServerCertificate=True;";
var customerConnectionString = builder.Configuration.GetConnectionString("CustomerConnection") 
    ?? "Server=localhost;Database=CustomerServiceDB;Trusted_Connection=True;TrustServerCertificate=True;";

// Register all DbContexts
builder.Services.AddDbContext<AuthDbContext>(options =>
{
    options.UseSqlServer(authConnectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    });
});

builder.Services.AddDbContext<DeliveryDbContext>(options =>
{
    options.UseSqlServer(deliveryConnectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    });
});

builder.Services.AddDbContext<RiderDbContext>(options =>
{
    options.UseSqlServer(riderConnectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    });
});

builder.Services.AddDbContext<OrderDbContext>(options =>
{
    options.UseSqlServer(orderConnectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    });
});

builder.Services.AddDbContext<CustomerDbContext>(options =>
{
    options.UseSqlServer(customerConnectionString);
});

// Register HTTP client for services that need it
builder.Services.AddHttpClient();

// Register all application services
builder.Services.AddScoped<IAuthService, AuthService.Services.AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IDeliveryService>(sp =>
{
    var deliveryContext = sp.GetRequiredService<DeliveryDbContext>();
    var orderContext = sp.GetRequiredService<OrderDbContext>();
    var riderContext = sp.GetRequiredService<RiderDbContext>();
    var config = sp.GetRequiredService<IConfiguration>();
    var logger = sp.GetRequiredService<ILogger<DeliveryService.Services.DeliveryService>>();
    return new DeliveryService.Services.DeliveryService(deliveryContext, orderContext, riderContext, config, logger);
});
builder.Services.AddScoped<IRiderService, RiderService.Services.RiderService>();
builder.Services.AddScoped<IOrderService>(sp =>
{
    var orderContext = sp.GetRequiredService<OrderDbContext>();
    var deliveryService = sp.GetRequiredService<IDeliveryService>();
    var riderContext = sp.GetRequiredService<RiderDbContext>();
    var logger = sp.GetRequiredService<ILogger<OrderService.Services.OrderService>>();
    return new OrderService.Services.OrderService(orderContext, deliveryService, riderContext, logger);
});

builder.Services.AddScoped<ICustomerService, CustomerService.Services.CustomerService>(sp =>
{
    var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
    var httpClient = httpClientFactory.CreateClient();
    var config = sp.GetRequiredService<IConfiguration>();
    var logger = sp.GetRequiredService<ILogger<CustomerService.Services.CustomerService>>();
    return new CustomerService.Services.CustomerService(httpClient, config, logger);
});

// Register background service for automatic order assignment
builder.Services.AddHostedService<UnifiedService.Services.OrderAssignmentBackgroundService>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured");
var issuer = jwtSettings["Issuer"] ?? "AuthService";
var audience = jwtSettings["Audience"] ?? "DeliveryService";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Configure Swagger/OpenAPI
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Unified Delivery Service API", 
        Version = "v1",
        Description = "Unified API combining Auth, Delivery, Rider, Order, and Customer services"
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

// Initialize all databases
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    
    // Initialize Auth DB
    try
    {
        var authContext = services.GetRequiredService<AuthDbContext>();
        logger.LogInformation("Initializing Auth database...");
        if (!authContext.Database.CanConnect())
        {
            authContext.Database.EnsureCreated();
            logger.LogInformation("Auth database created successfully");
        }
        else
        {
            authContext.Database.EnsureCreated();
            logger.LogInformation("Auth database verified");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error initializing Auth database");
    }
    
    // Initialize Delivery DB
    try
    {
        var deliveryContext = services.GetRequiredService<DeliveryDbContext>();
        logger.LogInformation("Initializing Delivery database...");
        if (!deliveryContext.Database.CanConnect())
        {
            deliveryContext.Database.EnsureCreated();
            logger.LogInformation("Delivery database created successfully");
        }
        else
        {
            deliveryContext.Database.EnsureCreated();
            logger.LogInformation("Delivery database verified");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error initializing Delivery database");
    }
    
    // Initialize Rider DB
    try
    {
        var riderContext = services.GetRequiredService<RiderDbContext>();
        logger.LogInformation("Initializing Rider database...");
        if (!riderContext.Database.CanConnect())
        {
            riderContext.Database.EnsureCreated();
            logger.LogInformation("Rider database created successfully");
        }
        else
        {
            riderContext.Database.EnsureCreated();
            logger.LogInformation("Rider database verified");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error initializing Rider database");
    }
    
    // Initialize Order DB
    try
    {
        var orderContext = services.GetRequiredService<OrderDbContext>();
        logger.LogInformation("Initializing Order database...");
        if (!orderContext.Database.CanConnect())
        {
            orderContext.Database.EnsureCreated();
            logger.LogInformation("Order database created successfully");
        }
        else
        {
            orderContext.Database.EnsureCreated();
            logger.LogInformation("Order database verified");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error initializing Order database");
    }
    
    // Initialize Customer DB
    try
    {
        var customerContext = services.GetRequiredService<CustomerDbContext>();
        logger.LogInformation("Initializing Customer database...");
        if (!customerContext.Database.CanConnect())
        {
            customerContext.Database.EnsureCreated();
            logger.LogInformation("Customer database created successfully");
        }
        else
        {
            customerContext.Database.EnsureCreated();
            logger.LogInformation("Customer database verified");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error initializing Customer database");
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Unified Service API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
