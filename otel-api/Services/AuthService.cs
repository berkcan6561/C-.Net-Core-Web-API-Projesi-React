using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using otel_api.Data;
using otel_api.DTOs;
using otel_api.Models;

namespace otel_api.Services
{
    public class AuthService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;

        public AuthService(ApplicationDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public async Task<(bool Success, string Message, AuthResponse? Data)> Register(RegisterRequest request)
        {
            if (await _db.Users.AnyAsync(u => u.Email == request.Email))
                return (false, "Bu e-posta zaten kayıtlı.", null);

            var customer = new Customer
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber
            };
            await _db.Customers.AddAsync(customer);
            await _db.SaveChangesAsync();

            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = "Customer",
                FirstName = request.FirstName,
                LastName = request.LastName,
                CustomerId = customer.Id
            };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            var token = GenerateToken(user);
            return (true, "Kayıt başarılı.", new AuthResponse
            {
                Token = token,
                Role = user.Role,
                FullName = $"{user.FirstName} {user.LastName}",
                UserId = user.Id,
                CustomerId = customer.Id
            });
        }

        public async Task<(bool Success, string Message, AuthResponse? Data)> Login(LoginRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return (false, "E-posta veya şifre hatalı.", null);

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return (false, "E-posta veya şifre hatalı.", null);

            var token = GenerateToken(user);
            return (true, "Giriş başarılı.", new AuthResponse
            {
                Token = token,
                Role = user.Role,
                FullName = $"{user.FirstName} {user.LastName}",
                UserId = user.Id,
                CustomerId = user.CustomerId
            });
        }

        private string GenerateToken(User user)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("CustomerId", user.CustomerId?.ToString() ?? "")
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}