using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using otel_api.Data;
using Microsoft.EntityFrameworkCore;

namespace otel_api.Services
{
    public class UnverifiedCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<UnverifiedCleanupService> _logger;

        public UnverifiedCleanupService(IServiceProvider serviceProvider, ILogger<UnverifiedCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Temizlik servisi çalışıyor...");

                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    // E-postası onaylanmamış ve token süresi dolmuş hesapları sil (Admin'in eklediği gerçek müşterilerin Customer nesnesi var diye user silinince customer silinmez, ama register olanlar user olarak eklenir)
                    var expiredUsers = await db.Users
                        .Where(u => !u.IsEmailVerified && u.VerificationTokenExpiry < DateTime.UtcNow).Take(500) // tek seferde en fazla 500
                        .ToListAsync(stoppingToken);

                    if (expiredUsers.Any())
                    {
                        // 1. Silinecek kullanıcıların Customer Id'lerini al
                        var customerIds = expiredUsers
                            .Where(u => u.CustomerId != null)
                            .Select(u => u.CustomerId!.Value)
                            .ToList();

                        using var transaction = await db.Database.BeginTransactionAsync(stoppingToken);
                        try
                        {
                            // 2. Önce bu Customer (Müşteri) kayıtlarını veritabanından sil
                            if (customerIds.Any())
                            {
                                var customersToDelete = await db.Customers
                                    .Where(c => customerIds.Contains(c.Id))
                                    .ToListAsync(stoppingToken);
                                
                                db.Customers.RemoveRange(customersToDelete);
                            }

                            // 3. Sonra Kullanıcıları (Users) sil
                            db.Users.RemoveRange(expiredUsers);
                            await db.SaveChangesAsync(stoppingToken);
                            await transaction.CommitAsync(stoppingToken);
                            
                            _logger.LogInformation($"{expiredUsers.Count} adet onaylanmamış çöp hesap ve ilişkili müşteri kayıtları silindi.");
                        }
                        catch (Exception)
                        {
                            await transaction.RollbackAsync(stoppingToken);
                            throw; // Re-throw to be caught by the outer catch block
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Çöp hesap temizliği sırasında bir hata oluştu.");
                }

                // Her 1 saatte bir çalış
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}
