using Microsoft.AspNetCore.Mvc;
using otel_api.DTOs;
using otel_api.Models;
using otel_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;

namespace otel_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] 
    [EnableRateLimiting("TokenBucketNavigation")]
    public class ReservationController : ControllerBase
    {
        private readonly ReservationService _service;
        public ReservationController(ReservationService service)
        {
            _service = service;
        }
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var r = await _service.GetByIdAsync(id);
            if (r == null) return NotFound();
            return Ok(r);
        }
        [HttpPost]
        [EnableRateLimiting("StrictReservationLimit")]
        public async Task<IActionResult> Create([FromBody] ReservationRequest request)
        {
            var reservation = new Reservation
            {
                CustomerId = request.CustomerId,
                RoomId = request.RoomId,
                CheckInDate = request.CheckInDate,
                CheckOutDate = request.CheckOutDate
            };
            var result = await _service.CreateReservation(reservation);
            if (!result.Success) return BadRequest(result.Message);
            return CreatedAtAction(nameof(GetById),new {id = result.Data?.Id}, result.Data);
        }
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id,[FromBody] ReservationRequest request)
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing == null) return NotFound();

            existing.CustomerId = request.CustomerId;
            existing.RoomId = request.RoomId;
            existing.CheckInDate = request.CheckInDate;
            existing.CheckOutDate = request.CheckOutDate;
            var result = await _service.UpdateReservationAsync(existing);
            if (!result.Success) return BadRequest(result.Message);
            return NoContent();
        }
        [HttpGet("my")]
        public async Task<IActionResult> GetMyReservations()
        {
            var customerIdStr = User.FindFirst("CustomerId")?.Value;
            if (string.IsNullOrEmpty(customerIdStr) || !int.TryParse(customerIdStr, out int customerId))
                return BadRequest("Müşteri kimliği bulunamadı.");

            var all = await _service.GetAllAsync();
            var myReservations = all.Where(r => r.CustomerId == customerId).ToList();
            return Ok(myReservations);
        }

  [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var res = await _service.GetByIdAsync(id);
            if (res == null) return NotFound("Rezervasyon bulunamadı.");
            if (res.CheckInDate.Date < DateTime.Now.Date)
                return BadRequest("Geçmiş tarihli veya başlamış rezervasyonlar asla silinemez.");
            await _service.DeleteReservationAsync(id);
            return NoContent();
        }

    }
}