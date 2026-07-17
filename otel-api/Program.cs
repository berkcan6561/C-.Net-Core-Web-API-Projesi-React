using Microsoft.EntityFrameworkCore;
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
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
                    PermitLimit = 3, // 1 dakika içerisinde en fazla 20 istek
                    Window = TimeSpan.FromMinutes(1), //zaman dilimi: 1 dakika
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0 //direk reddet sıraya alma
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
app.UseCors("AllowAll");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

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