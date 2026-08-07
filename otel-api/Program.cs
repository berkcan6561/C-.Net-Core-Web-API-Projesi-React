using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using otel_api.Data;
using otel_api.Repositories;
using otel_api.Services;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using otel_api.Models;
using Microsoft.Extensions.Options;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using MimeKit;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true); 

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(Options =>
{
    Options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
       options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
       options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(Options =>
    {
        Options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

    //Ip tabalı rate limiter
    builder.Services.AddRateLimiter(Options =>
    {
        Options.AddPolicy("IpBaseLoginRegister", context =>
        {
            //kullanıcın Ip adresini alıyoruz
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unkown";

            return RateLimitPartition.GetFixedWindowLimiter(ip, _=>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10, // 10 saniyede 10 istek (daha esnek)
                    Window = TimeSpan.FromSeconds(10),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
        });

        // Dashboard vb. normal gezinmeler için Token Bucket Rate Limiter
        Options.AddPolicy("TokenBucketNavigation", context =>
        {
            var isAdmin = context.User.IsInRole("Admin");

            var key = context.User.Identity?.IsAuthenticated == true 
                ? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                : context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            if (isAdmin)
            {
                return RateLimitPartition.GetNoLimiter(key!);
            }
            return RateLimitPartition.GetTokenBucketLimiter(key!, _ =>
                new TokenBucketRateLimiterOptions
                {
                    TokenLimit = 30, // Anlık maksimum 30 istek (React'in çoklu komponent yüklemelerini rahatça kurtarır)
                    TokensPerPeriod = 15, // Her 10 saniyede bir 15 jeton yenilenir (Hızlı gezinmeyi destekler)
                    ReplenishmentPeriod = TimeSpan.FromSeconds(10), 
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0 // Sıraya alıp web sitesini dondurma (yavaşlama hissini önler), direkt reddet
                });
        });
        // Rezervasyon oluşturma için JWT'deki Kullanıcı ID'sine (NameIdentifier) dayalı katı limit
        Options.AddPolicy("StrictReservationLimit", context =>
        {
            var isAdmin = context.User.IsInRole("Admin");
            var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
            if( isAdmin)
            {
                return RateLimitPartition.GetNoLimiter(userId);
            }
            return RateLimitPartition.GetFixedWindowLimiter(userId, _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 3, 
                    Window = TimeSpan.FromHours(1),
                    QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0 
                });
        });
        
        //Profil resmi için rate limit
        Options.AddPolicy("AvatarUploadLimit", context =>
        {
            var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "unkown";
            return RateLimitPartition.GetFixedWindowLimiter(userId, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromHours(1),
                QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
        });

        // Güvenlik işlemleri (Şifre sıfırlama, E-posta doğrulama) için katı limit (Brute-Force Koruması)
        Options.AddPolicy("StrictSecurityLimit", context =>
        {
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            return RateLimitPartition.GetFixedWindowLimiter(ip, _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5, // 15 dakikada en fazla 5 istek (Spam/Brute-Force engeller)
                    Window = TimeSpan.FromMinutes(15),
                    QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
        });

        Options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    });
builder.Services.AddAuthorization();
builder.Services.AddScoped<CustomerRepository>();
builder.Services.AddScoped<RoomRepository>();
builder.Services.AddScoped<ReservationRepository>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddHostedService<UnverifiedCleanupService>();
builder.Services.AddScoped<CustomerService>();
builder.Services.AddScoped<RoomService>();
builder.Services.AddScoped<ReservationService>();
builder.Services.AddMemoryCache();

var app = builder.Build();

if(app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
if (!Directory.Exists(webRootPath)) Directory.CreateDirectory(webRootPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRootPath),
    RequestPath = ""
});
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    // db.Database.EnsureCreated(); yerine Migrate() kullanıyoruz ki Migration'lar düzgün çalışsın.
    db.Database.Migrate();

if(!db.Users.Any(u => u.Role == "Admin"))
{
    db.Users.Add(new User
    {
        Email = "admin@otel.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
        Role = "Admin",
        FirstName = "Admin",
        LastName = "User",
        IsEmailVerified = true
    });
    db.SaveChanges();
}
else
{
    var existingAdmin = db.Users.FirstOrDefault(u => u.Email == "admin@otel.com");
    if (existingAdmin != null)
    {
        existingAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123");
        existingAdmin.IsEmailVerified = true;
        existingAdmin.LockoutEnd = null;
        existingAdmin.FailedLoginAttempts = 0;
        db.SaveChanges();
    }
}

// Zaten oluşmuş unverified adminleri düzeltelim
var unverifiedAdmins = db.Users.Where(u => u.Role == "Admin" && !u.IsEmailVerified).ToList();
if(unverifiedAdmins.Any())
{
    foreach(var admin in unverifiedAdmins)
    {
        admin.IsEmailVerified = true;
    }
    db.SaveChanges();
}
 }
app.MapControllers();
app.Run();