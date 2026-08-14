using System.ComponentModel.DataAnnotations;

namespace otel_api.DTOs
{
    public class RegisterRequest
    {
        [Required, MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required, MaxLength(50)]
        public string LastName { get; set; } = string.Empty;
        
        [Required, EmailAddress, MaxLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;
        
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;
    }
    public class LoginRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;

        public string? RecaptchaToken { get; set; }
    }
    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public int UserId { get; set; }
        public int? CustomerId { get; set; }
        public string? AvatarUrl { get; set; }
    }
}