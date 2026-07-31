using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using otel_api.Data;
using otel_api.DTOs;
using otel_api.Models;
using Microsoft.Extensions.Caching.Memory;

namespace otel_api.Services
{
    public class AuthService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly EmailService _emailService;
        private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _cache;

        public AuthService(ApplicationDbContext db, IConfiguration config, EmailService emailService, Microsoft.Extensions.Caching.Memory.IMemoryCache cache)
        {
            _db = db;
            _config = config;
            _emailService = emailService;
            _cache = cache;
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
                CustomerId = customer.Id,
                IsEmailVerified = false,
                VerificationToken = Guid.NewGuid().ToString(),
                VerificationTokenExpiry = DateTime.UtcNow.AddHours(24)
            };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            var verifyLink = $"http://localhost:5173/verify-email?token={user.VerificationToken}";
            var mailBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;'>
                    <div style='text-align: center; margin-bottom: 24px;'>
                        <h1 style='color: #0f172a; margin: 0; font-size: 24px; font-weight: bold;'>The Luna Suites</h1>
                        <p style='color: #64748b; margin-top: 4px; font-size: 14px;'>Hotel & Residences</p>
                    </div>
                    <div style='background-color: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>
                        <h2 style='color: #1e293b; margin-top: 0; font-size: 20px;'>Aramıza Hoş Geldiniz, {user.FirstName}!</h2>
                        <p style='color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 24px;'>
                            Luna Suites Hotel'de sizin için harika deneyimler hazırlıyoruz. Kayıt işleminizi tamamlamak ve rezervasyon yapmaya başlamak için lütfen e-posta adresinizi onaylayın.
                        </p>
                        <div style='text-align: center;'>
                            <a href='{verifyLink}' style='display: inline-block; background-color: #0f172a; color: #f59e0b; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 6px; font-size: 16px;'>Hesabımı Onayla</a>
                        </div>
                        <p style='color: #94a3b8; font-size: 13px; margin-top: 24px; text-align: center;'>
                            Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.
                        </p>
                    </div>
                    <div style='text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;'>
                        &copy; {DateTime.Now.Year} The Luna Suites Hotel. Tüm hakları saklıdır.
                    </div>
                </div>";
            await _emailService.SendEmailAsync(user.Email, "The Luna Suites - E-Posta Onayı", mailBody);

            return (true, "Kayıt başarılı. Lütfen e-posta adresinize gelen linke tıklayarak hesabınızı onaylayın.", null);
        }

        public async Task<(bool Success, string Message, AuthResponse? Data)> Login(LoginRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return (false, "E-posta veya şifre hatalı.", null);

            // 1. Kilitlenme (Lockout) Kontrolü
            if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
            {
                var remainingTime = user.LockoutEnd.Value - DateTime.UtcNow;
                return (false, $"Hesabınız kilitlendi. Lütfen {Math.Ceiling(remainingTime.TotalMinutes)} dakika sonra tekrar deneyin.", null);
            }

            // 2. Şifre Doğrulama
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                // Yanlış şifre girildiğinde sayacı artır
                user.FailedLoginAttempts += 1;
                
                // 5. hatada hesabı 1 saat kilitle
                if (user.FailedLoginAttempts >= 5)
                {
                    user.LockoutEnd = DateTime.UtcNow.AddHours(1); // 1 saat kilit
                    await _db.SaveChangesAsync();
                    return (false, "Çok fazla hatalı giriş yaptınız. Hesabınız 1 saat süreyle güvenlik amacıyla kilitlendi.", null);
                }

                await _db.SaveChangesAsync(); // Sayacı veritabanına kaydet
                return (false, "E-posta veya şifre hatalı.", null);
            }

            if (!user.IsEmailVerified)
            {
                return (false, "Lütfen giriş yapmadan önce e-posta adresinizi onaylayın.", null);
            }

            // 3. Başarılı girişte sayacı ve kilitlenmeyi sıfırla
            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
            await _db.SaveChangesAsync();

            var token = GenerateToken(user);
            return (true, "Giriş başarılı.", new AuthResponse
            {
                Token = token,
                Role = user.Role,
                FullName = $"{user.FirstName} {user.LastName}",
                UserId = user.Id,
                CustomerId = user.CustomerId,
                AvatarUrl = user.AvatarUrl
            });
        }

        public async Task<(bool Success, string Message)> VerifyEmail(string token)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.VerificationToken == token);
            if (user == null) return (false, "Geçersiz doğrulama kodu.");
            
            if (user.VerificationTokenExpiry < DateTime.UtcNow) return (false, "Doğrulama kodunun süresi dolmuş.");

            user.IsEmailVerified = true;
            user.VerificationToken = null;
            user.VerificationTokenExpiry = null;
            await _db.SaveChangesAsync();

            return (true, "E-posta adresiniz başarıyla onaylandı. Artık giriş yapabilirsiniz.");
        }

        public async Task<(bool Success, string Message)> ResendVerificationEmail(string email)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null || user.IsEmailVerified)
                return (false, "Bu e-posta adresine ait onay bekleyen bir hesap bulunamadı.");

            // Cache kontrolü - Spam koruması
            string cacheKey = $"resend_email_{email}";
            if (_cache.TryGetValue(cacheKey, out _))
            {
                return (false, "Lütfen yeni bir e-posta göndermek için 1 dakika bekleyin.");
            }

            // Yeni token oluştur ve veritabanını güncelle
            user.VerificationToken = Guid.NewGuid().ToString();
            user.VerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
            await _db.SaveChangesAsync();

            // Yeni maili gönder
            var verifyLink = $"http://localhost:5173/verify-email?token={user.VerificationToken}";
            var mailBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;'>
                    <div style='text-align: center; margin-bottom: 24px;'>
                        <h1 style='color: #0f172a; margin: 0; font-size: 24px; font-weight: bold;'>The Luna Suites</h1>
                        <p style='color: #64748b; margin-top: 4px; font-size: 14px;'>Hotel & Residences</p>
                    </div>
                    <div style='background-color: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>
                        <h2 style='color: #1e293b; margin-top: 0; font-size: 20px;'>E-Posta Doğrulama (Tekrar)</h2>
                        <p style='color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 24px;'>
                            Merhaba {user.FirstName},<br><br>
                            E-posta adresinizi onaylamanız için yeni bir bağlantı talep ettiniz. Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:
                        </p>
                        <div style='text-align: center;'>
                            <a href='{verifyLink}' style='display: inline-block; background-color: #0f172a; color: #f59e0b; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 6px; font-size: 16px;'>Hesabımı Onayla</a>
                        </div>
                    </div>
                    <div style='text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;'>
                        &copy; {DateTime.Now.Year} The Luna Suites Hotel. Tüm hakları saklıdır.
                    </div>
                </div>";

            await _emailService.SendEmailAsync(user.Email, "The Luna Suites - E-Posta Onayı (Tekrar)", mailBody);

            // 1 dakikalık cache süresi ayarla
            _cache.Set(cacheKey, true, TimeSpan.FromMinutes(1));

            return (true, "Doğrulama e-postası başarıyla tekrar gönderildi.");
        }

        public async Task<(bool Success, string Message)> ForgotPassword(string email)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) 
                return (true, "Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama linki gönderilmiştir."); // Güvenlik için hep true döneriz

            user.ResetPasswordToken = Guid.NewGuid().ToString();
            user.ResetPasswordTokenExpiry = DateTime.UtcNow.AddHours(1);
            await _db.SaveChangesAsync();

            var resetLink = $"http://localhost:5173/reset-password?token={user.ResetPasswordToken}";
            var mailBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;'>
                    <div style='text-align: center; margin-bottom: 24px;'>
                        <h1 style='color: #0f172a; margin: 0; font-size: 24px; font-weight: bold;'>The Luna Suites</h1>
                        <p style='color: #64748b; margin-top: 4px; font-size: 14px;'>Hotel & Residences</p>
                    </div>
                    <div style='background-color: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>
                        <h2 style='color: #1e293b; margin-top: 0; font-size: 20px;'>Şifre Sıfırlama Talebi</h2>
                        <p style='color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 24px;'>
                            Merhaba {user.FirstName},<br><br>
                            Hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak güvenli bir şekilde yeni şifrenizi belirleyebilirsiniz.
                        </p>
                        <div style='text-align: center;'>
                            <a href='{resetLink}' style='display: inline-block; background-color: #0f172a; color: #f59e0b; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 6px; font-size: 16px;'>Şifremi Sıfırla</a>
                        </div>
                        <p style='color: #94a3b8; font-size: 13px; margin-top: 24px; text-align: center;'>
                            Bu bağlantı güvenlik amacıyla 1 saat içinde geçerliliğini yitirecektir.<br>
                            Eğer şifre sıfırlama talebinde bulunmadıysanız, hesabınız güvendedir ve bu e-postayı silebilirsiniz.
                        </p>
                    </div>
                    <div style='text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;'>
                        &copy; {DateTime.Now.Year} The Luna Suites Hotel. Tüm hakları saklıdır.
                    </div>
                </div>";
            await _emailService.SendEmailAsync(user.Email, "The Luna Suites - Şifre Sıfırlama", mailBody);

            return (true, "Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama linki gönderilmiştir.");
        }

        public async Task<(bool Success, string Message)> ResetPassword(string token, string newPassword)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.ResetPasswordToken == token);
            if (user == null) return (false, "Geçersiz şifre sıfırlama kodu.");
            
            if (user.ResetPasswordTokenExpiry < DateTime.UtcNow) return (false, "Şifre sıfırlama kodunun süresi dolmuş.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.ResetPasswordToken = null;
            user.ResetPasswordTokenExpiry = null;
            // Şifre değişince kilitlenmeyi de kaldıralım
            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
            await _db.SaveChangesAsync();

            return (true, "Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.");
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