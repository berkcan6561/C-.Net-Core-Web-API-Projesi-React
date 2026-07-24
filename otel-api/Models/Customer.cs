using System.ComponentModel.DataAnnotations.Schema;

namespace otel_api.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public string? AvatarUrl {get; set;}
        public bool ReceivePromotionalEmails {get; set;} = true;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        [NotMapped]
        public DateTime? LockoutEnd { get; set; }
    }
}