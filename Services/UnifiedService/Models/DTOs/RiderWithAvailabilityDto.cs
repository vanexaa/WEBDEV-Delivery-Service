namespace RiderService.Models.DTOs;

/// <summary>
/// DTO for rider with availability status (for Admin dashboard)
/// </summary>
public class RiderWithAvailabilityDto
{
    public int RiderId { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? VehicleType { get; set; }
    public string? VehicleNumber { get; set; }
    public string? LicenseNumber { get; set; }
    public bool IsActive { get; set; }
    public bool IsOnline { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
