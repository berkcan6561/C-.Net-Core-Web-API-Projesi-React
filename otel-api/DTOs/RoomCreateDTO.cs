using System.ComponentModel.DataAnnotations;

namespace otel_api.DTOs
{
    public class RoomCreateDTO
    {
        [Required(ErrorMessage = "Oda numarası zorunludur.")]
        [MaxLength(20)]
        public string RoomNumber { get; set; } = string.Empty;

        [Required]
        [Range(1, 100000)]
        public decimal PricePerNight { get; set; }

        [Required]
        [Range(1, 20)]
        public int Capacity { get; set; }
    }
}
