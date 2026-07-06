using Microsoft.EntityFrameworkCore;
using otel_api.Data;
using otel_api.Repositories; // Bu klasörleri tanıması için şart
using otel_api.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// 1. Controller'ları ekle
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Veritabanı bağlantısı
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. DI (Dependency Injection) Kayıtları - SİSTEMİN KALBİ BURASI
// Müşteri servisleri
builder.Services.AddScoped<CustomerRepository>();
builder.Services.AddScoped<CustomerService>();

// Rezervasyon servisleri
builder.Services.AddScoped<ReservationRepository>();
builder.Services.AddScoped<ReservationService>();

// Oda servisleri (Eğer varsa)
builder.Services.AddScoped<RoomRepository>();
builder.Services.AddScoped<RoomService>();

var app = builder.Build();

// 4. Swagger ayarları
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 5. Veritabanını otomatik oluştur
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.EnsureCreated();
}

app.MapControllers();
app.Run();