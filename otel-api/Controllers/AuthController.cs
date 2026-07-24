using Microsoft.AspNetCore.Mvc;
using otel_api.DTOs;
using otel_api.Services;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.VisualBasic;

namespace otel_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("IpBaseLoginRegister")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly otel_api.Data.ApplicationDbContext _db;

        public AuthController(AuthService authService, otel_api.Data.ApplicationDbContext db)
        {
            _authService = authService;
            _db = db;
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
        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();
            
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
                return BadRequest("Mevcut şifreniz yanlış.");
            
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Şifreniz başarıyla güncellendi"});
        }

        [Authorize]
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Dosya seçilmedi.");

            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext)) return BadRequest("Sadece resim yükleyebilirsiniz.");

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + ext;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var user = await _db.Users.FindAsync(userId);
            if(user != null) {
                user.AvatarUrl = "/avatars/" + uniqueFileName;
                await _db.SaveChangesAsync();
            }

            return Ok(new { avatarUrl = user?.AvatarUrl });
        }
    }
}