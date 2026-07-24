namespace otel_api.Models
{
    public class Room
    {
        public int Id { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public decimal PricePerNight { get; set; }
        public List<string> ImageUrls { get; set; } = new List<string>();
    }
}