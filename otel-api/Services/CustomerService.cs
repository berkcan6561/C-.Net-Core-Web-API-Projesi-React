using otel_api.Models;
using otel_api.Repositories;

namespace otel_api.Services
{
    public class CustomerService
    {
        private readonly CustomerRepository _repo;
        public CustomerService(CustomerRepository repo) => _repo = repo;

        public async Task<List<Customer>> GetAllAsync() => await _repo.GetAllAsync();

        public async Task<Customer?> GetByIdAsync(int id) => await _repo.GetByIdAsync(id);

        public async Task<(bool Success, string Message, Customer? Data)> CreateCustomer(Customer customer)
        {
            await _repo.AddAsync(customer);
            return (true, "Müşteri başarıyla eklendi.", customer);
        }

        public async Task UpdateCustomerAsync(Customer customer) => await _repo.UpdateAsync(customer);

        public async Task DeleteCustomerAsync(int id) => await _repo.DeleteAsync(id);
    }
}