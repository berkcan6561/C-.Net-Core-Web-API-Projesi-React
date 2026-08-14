using System.ComponentModel.DataAnnotations;

namespace otel_api.DTOs
{
    public class ReservationRequest
    {
        [Required(ErrorMessage = "Müşteri ID zorunludur.")]
        [Range(1, int.MaxValue, ErrorMessage = "Geçerli bir müşteri ID giriniz.")]
        public int CustomerId { get; set; }
        
        [Required(ErrorMessage = "Oda ID zorunludur.")]
        [Range(1, int.MaxValue, ErrorMessage = "Geçerli bir oda ID giriniz.")]
        public int RoomId { get; set; }
        
        [Required(ErrorMessage = "Giriş tarihi zorunludur.")]
        public DateTime CheckInDate { get; set; }
        
        [Required(ErrorMessage = "Çıkış tarihi zorunludur.")]
        public DateTime CheckOutDate { get; set; }
    }
}
