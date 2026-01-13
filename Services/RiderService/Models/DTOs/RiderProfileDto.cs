namespace RiderService.Models.DTOs;

public class RiderProfileDto
{
    public int RiderId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? VehicleType { get; set; }
    public string? VehicleNumber { get; set; }
    public bool IsOnline { get; set; }
    public decimal TotalEarnings { get; set; }
    public int TotalDeliveries { get; set; }
    public double AverageRating { get; set; }
}
