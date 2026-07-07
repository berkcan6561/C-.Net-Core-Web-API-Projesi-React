using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using otel_api.Models;
using otel_api.Services;

namespace otel_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // 1- Bu Controller'a artık SADECE giriş yapmış kişiler erişebilir
    public class RoomController : ControllerBase
    {
        private readonly RoomService _roomService;

        public RoomController(RoomService roomService)
        {
            _roomService = roomService;
        }

        // GET: api/room -> Müşteri ve Admin görebilir
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _roomService.GetRoomsAsync();
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _roomService.GetRoomByIdAsync(id);
            if (data == null) return NotFound("Oda bulunamadı.");
            return Ok(data);
        }
        
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableRooms([FromQuery] string start, [FromQuery] string end)
        {
            if (!DateTime.TryParse(start, out var startDate) || !DateTime.TryParse(end, out var endDate))
                return BadRequest("Geçersiz tarih formatı.");

            var data = await _roomService.GetAvailableRoomsAsync(startDate, endDate);
            return Ok(data);
        }

        // POST: api/room -> SADECE ADMIN EKLEYEBİLİR
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Room room)
        {
            await _roomService.CreateRoomAsync(room);
            return CreatedAtAction(nameof(GetById), new { id = room.Id }, room);
        }

        // PUT: api/room/5 -> SADECE ADMIN FİYAT/BİLGİ GÜNCELLEYEBİLİR
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Room room)
        {
            if (id != room.Id) return BadRequest("ID uyuşmazlığı.");
            await _roomService.UpdateRoomAsync(room);
            return NoContent();
        }

        // DELETE: api/room/5 -> SADECE ADMIN SİLEBİLİR
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _roomService.DeleteRoomAsync(id);
            return NoContent();
        }
    }
}