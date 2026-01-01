namespace Ayawkomagbackend.DTOs
{
    public class RiderFeedbackSummaryDto
    {
        public double AverageRating { get; set; }
        public List<FeedbackResponseDto> Feedbacks { get; set; } = new();
    }
}
