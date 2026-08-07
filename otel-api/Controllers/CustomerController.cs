using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using otel_api.Models;
using otel_api.Services;

using Microsoft.AspNetCore.RateLimiting;

namespace otel_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // DİKKAT: Müşteri verilerini sadece Admin görebilir ve yönetebilir!
    [EnableRateLimiting("TokenBucketNavigation")]
    public class CustomerController : ControllerBase
    {
        private readonly CustomerService _customerService;

        public CustomerController(CustomerService customerService)
        {
            _customerService = customerService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _customerService.GetAllAsync();
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _customerService.GetByIdAsync(id);
            if (data == null) return NotFound("Müşteri bulunamadı.");
            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] otel_api.DTOs.CustomerCreateDTO dto)
        {
            var result = await _customerService.CreateCustomer(dto);
            if (!result.Success) return BadRequest(result.Message);
            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Customer customer)
        {
            if (id != customer.Id) return BadRequest("ID uyuşmazlığı.");
            await _customerService.UpdateCustomerAsync(customer);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _customerService.DeleteCustomerAsync(id);
            if (!result.Success) return BadRequest(result.Message);
            return NoContent();
        }
    }
}