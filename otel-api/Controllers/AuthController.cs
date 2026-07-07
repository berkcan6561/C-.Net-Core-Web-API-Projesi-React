using Microsoft.AspNetCore.Mvc;
using otel_api.DTOs;
using otel_api.Services;

namespace otel_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
    }
}