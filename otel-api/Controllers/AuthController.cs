using Microsoft.AspNetCore.Mvc;
using otel_api.DTOs;
using otel_api.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace otel_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("IpBaseLoginRegister")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        public AuthController(AuthService authService)
        {
            _authService = authService;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var result = await _authService.Register(request);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result.Data);
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.Login(request);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result.Data);
        }
        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token)) return BadRequest("Token bulunamadı.");
            var result = await _authService.VerifyEmail(token);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(new { message = result.Message });
        }

        [HttpPost("resend-verification-email")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationEmailRequest request)
        {
            var result = await _authService.ResendVerificationEmail(request.Email);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(new { message = result.Message });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var result = await _authService.ForgotPassword(request.Email);
            // Güvenlik için e-posta olsa da olmasa da hep başarılı döneriz ki kötü niyetli kişiler hangi e-postaların kayıtlı olduğunu bulamasın
            return Ok(new { message = result.Message });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var result = await _authService.ResetPassword(request.Token, request.NewPassword);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(new { message = result.Message });
        }
    }
}