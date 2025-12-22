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
