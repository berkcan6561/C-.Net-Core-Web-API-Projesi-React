namespace otel_api.DTOs
{
    public class ForgotPasswordRequest
    {
        public required string Email { get; set; }
    }

    public class ResetPasswordRequest
    {
        public required string Token { get; set; }
        public required string NewPassword { get; set; }
    }

    public class ResendVerificationEmailRequest
    {
        public required string Email { get; set; }
    }
}
