using Microsoft.EntityFrameworkCore;
using otel_api.Data;
using otel_api.Models;

namespace otel_api.Repositories
{
    public class CustomerRepository
    {
        private readonly ApplicationDbContext _db;
        public CustomerRepository(ApplicationDbContext db) => _db = db;

        public async Task<List<Customer>> GetAllAsync() => await _db.Customers.ToListAsync();

        public async Task AddAsync(Customer customer)
        {
            await _db.Customers.AddAsync(customer);
            await _db.SaveChangesAsync();
        }

        public async Task<Customer?> GetByIdAsync(int id) => await _db.Customers.FindAsync(id);
        
        public async Task UpdateAsync(Customer customer)
        {
            _db.Customers.Update(customer);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var c = await _db.Customers.FindAsync(id);
            if (c == null) return;
            _db.Customers.Remove(c);
            await _db.SaveChangesAsync();
        }
    }
}