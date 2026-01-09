namespace Ayawkomagbackend.DTOs
{
    public class FeedbackResponseDto
    {
        public int FeedbackId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
