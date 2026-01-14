namespace RiderService.Models.DTOs;

public class RiderListDto
{
    public int RiderId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? VehicleType { get; set; }
    public bool IsOnline { get; set; }
    public bool IsActive { get; set; }
}
