using otel_api.Data;
using otel_api.DTOs;
using otel_api.Models;
using otel_api.Repositories;

namespace otel_api.Services
{
    public class CustomerService
    {
        private readonly CustomerRepository _repo;
        private readonly ApplicationDbContext _db;
        
        public CustomerService(CustomerRepository repo, ApplicationDbContext db)
        {
            _repo = repo;
            _db = db;
        }

        public async Task<List<Customer>> GetAllAsync() => await _repo.GetAllAsync();

        public async Task<Customer?> GetByIdAsync(int id) => await _repo.GetByIdAsync(id);

        public async Task<(bool Success, string Message, Customer? Data)> CreateCustomer(CustomerCreateDTO dto)
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
                    IsEmailVerified = true
                };
                await _db.Users.AddAsync(user);
                await _db.SaveChangesAsync();
            }

            return (true, "Müşteri başarıyla eklendi.", customer);
        }

        public async Task UpdateCustomerAsync(Customer customer) => await _repo.UpdateAsync(customer);

        public async Task<(bool Success, string Message)> DeleteCustomerAsync(int id)
        {
            // Müşterinin mevcut rezervasyonları var mı kontrol et
            var hasReservations = _db.Reservations.Any(r => r.CustomerId == id);
            if (hasReservations)
            {
                return (false, "Bu müşteriye ait sistemde finansal geçmiş (rezervasyon) bulunduğu için silinemez. Lütfen silmek yerine hesabı devre dışı bırakmayı tercih edin.");
            }

            // Önce varsa User hesabını sil
            var user = _db.Users.FirstOrDefault(u => u.CustomerId == id);
            if (user != null)
            {
                _db.Users.Remove(user);
            }

            await _repo.DeleteAsync(id);
            return (true, "Müşteri başarıyla silindi.");
        }
    }
}