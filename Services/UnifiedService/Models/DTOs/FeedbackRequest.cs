namespace CustomerService.Models.DTOs;

public class FeedbackRequest
{
    public int Rating { get; set; } // 1-5
    public string? Comment { get; set; }
}
