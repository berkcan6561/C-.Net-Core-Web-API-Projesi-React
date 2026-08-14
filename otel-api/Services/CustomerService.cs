using otel_api.Data;
using otel_api.DTOs;
using otel_api.Models;
using otel_api.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace otel_api.Services
{
    public class CustomerService
    {
        private readonly CustomerRepository _repo;
        private readonly ApplicationDbContext _db;
        private readonly EmailService _emailService;
        private readonly IConfiguration _config;
        
        public CustomerService(CustomerRepository repo, ApplicationDbContext db, EmailService emailService, IConfiguration config)
        {
            _repo = repo;
            _db = db;
            _emailService = emailService;
            _config = config;
        }

        public async Task<List<Customer>> GetAllAsync() => await _repo.GetAllAsync();

        public async Task<Customer?> GetByIdAsync(int id) => await _repo.GetByIdAsync(id);

        public async Task<(bool Success, string Message, Customer? Data)> CreateCustomer(CustomerCreateDTO dto)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                var customer = new Customer
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber
                };

                await _repo.AddAsync(customer);

                if (!string.IsNullOrEmpty(dto.Password))
                {
                    var user = new User
                    {
                        Email = dto.Email,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                        Role = "Customer",
                        FirstName = dto.FirstName,
                        LastName = dto.LastName,
                        CustomerId = customer.Id,
                        IsEmailVerified = false,
                        VerificationToken = Guid.NewGuid().ToString(),
                        VerificationTokenExpiry = DateTime.UtcNow.AddHours(24)
                    };
                    await _db.Users.AddAsync(user);
                    await _db.SaveChangesAsync();
                    
                    var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:5173";
                    var verifyLink = $"{frontendUrl.TrimEnd('/')}/verify-email?token={user.VerificationToken}";
                    var mailBody = $"Hoş geldiniz, {user.FirstName}! Lütfen e-postanızı onaylayın: <a href='{verifyLink}'>Onayla</a>";
                    await _emailService.SendEmailAsync(user.Email, "The Luna Suites - E-Posta Onayı", mailBody);
                }

                await transaction.CommitAsync();
                return (true, "Müşteri başarıyla eklendi.", customer);
            }
            catch
            {
                await transaction.RollbackAsync();
                return (false, "Müşteri eklenirken hata oluştu.", null);
            }
        }

        public async Task UpdateCustomerAsync(Customer customer)
        {
            await _repo.UpdateAsync(customer);
            
            // Kullanıcı varsa, bilgileri senkronize et
            var user = await _db.Users.FirstOrDefaultAsync(u => u.CustomerId == customer.Id);
            if (user != null)
            {
                user.FirstName = customer.FirstName;
                user.LastName = customer.LastName;
                user.Email = customer.Email;
                await _db.SaveChangesAsync();
            }
        }

        public async Task<(bool Success, string Message)> DeleteCustomerAsync(int id)
        {
            // Müşterinin mevcut rezervasyonları var mı kontrol et
            var hasReservations = await _db.Reservations.AnyAsync(r => r.CustomerId == id);
            if (hasReservations)
            {
                return (false, "Bu müşteriye ait sistemde finansal geçmiş (rezervasyon) bulunduğu için silinemez. Lütfen silmek yerine hesabı devre dışı bırakmayı tercih edin.");
            }
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
            // Önce varsa User hesabını sil
            var user = await _db.Users.FirstOrDefaultAsync(u => u.CustomerId == id);
            if (user != null)
            {
                _db.Users.Remove(user);
                await _db.SaveChangesAsync();
            }

            await _repo.DeleteAsync(id);
            await transaction.CommitAsync();
            return (true, "Müşteri başarıyla silindi.");
        }
        catch
        {
            await transaction.RollbackAsync();
            return (false, "Müşteri silinirken hata oluştu.");
        }
    }
    }
}