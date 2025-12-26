using Backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq; // <-- ADDED: Necessary for Enumerable.Range in the boilerplate code

// 1. CREATE the builder variable first!
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// --- START: Database Configuration ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? 
    "Server=JUYSI\\SQLEXPRESS;Database=DeliveryServiceDB;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

builder.Services.AddDbContext<DeliveryContext>(options =>
    options.UseSqlServer(connectionString));
// --- END: Database Configuration ---

// Add API Controllers and necessary services for Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Enable Swagger UI in development mode
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Map your new Controllers (crucial for your /api/customers endpoints to work)
app.MapControllers();

// -------------------------------------------------------------
// WeatherForecast code (Standard boilerplate)
// -------------------------------------------------------------
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}