namespace otel_api.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer"; // "Admin" veya "Customer"
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        // Müşteri ise bağlı Customer kaydı
        public int? CustomerId { get; set; }
        public Customer? Customer { get; set; }
    }
}