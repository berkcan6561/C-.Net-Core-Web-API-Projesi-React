using System.ComponentModel.DataAnnotations;

namespace otel_api.DTOs
{
    public class CustomerUpdateDTO
    {
        [Required, MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
