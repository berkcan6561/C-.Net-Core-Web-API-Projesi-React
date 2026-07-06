using Microsoft.AspNetCore.Mvc;
using otel_api.DTOs;
using otel_api.Models;
using otel_api.Services;

namespace otel_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController : ControllerBase
    {
        private readonly ReservationService _service;

        public ReservationController(ReservationService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var r = await _service.GetByIdAsync(id);
            if (r == null) return NotFound();
            return Ok(r);
        }

        [HttpPost]
        [Consumes("application/json")]
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
            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result.Data);
        }

        [HttpPut("{id}")]
        [Consumes("application/json")]
        public async Task<IActionResult> Update(int id, [FromBody] ReservationRequest request)
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteReservationAsync(id);
            return NoContent();
        }
    }
}