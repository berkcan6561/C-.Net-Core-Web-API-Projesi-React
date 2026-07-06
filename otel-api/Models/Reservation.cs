namespace otel_api.Models
{
    public class Reservation
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int RoomId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public decimal TotalPrice { get; set; }

        // İlişkiler (Include için gerekli)
        public Room? Room { get; set; }
        public Customer? Customer { get; set; }
    }
}