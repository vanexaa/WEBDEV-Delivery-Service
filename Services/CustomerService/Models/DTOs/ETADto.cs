namespace CustomerService.Models.DTOs;

public class ETADto
{
    public int OrderId { get; set; }
    public int? EstimatedTime { get; set; } // in minutes
    public string Status { get; set; } = string.Empty;
    public DateTime? EstimatedArrival { get; set; }
}
