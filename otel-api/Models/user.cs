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

        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LockoutEnd { get; set; }

        public int? CustomerId { get; set; }

        public bool IsEmailVerified { get; set; } = false;
        public string? VerificationToken { get; set; }
        public DateTime? VerificationTokenExpiry { get; set; }

        public string? ResetPasswordToken { get; set; }
        public DateTime? ResetPasswordTokenExpiry { get; set; }

        public Customer? Customer { get; set; }
        public string? AvatarUrl { get; set;}
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }
    }
}