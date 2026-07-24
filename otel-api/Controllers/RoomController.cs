using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using otel_api.Models;
using otel_api.Services;

using Microsoft.AspNetCore.RateLimiting;

namespace otel_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // 1- Bu Controller'a artık SADECE giriş yapmış kişiler erişebilir
    [EnableRateLimiting("TokenBucketNavigation")]
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

        [HttpPost("{id}/images")]
        public async Task<IActionResult> UploadImages(int id, [FromForm] IFormFileCollection files)
        {
            var room = await _roomService.GetRoomByIdAsync(id);
            if (room == null) return NotFound();

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "rooms");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    var sanitizedFileName = file.FileName.Replace(" ", "_");
                    var uniqueFileName = Guid.NewGuid().ToString() + "_" + sanitizedFileName;
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                    room.ImageUrls.Add($"/images/rooms/{uniqueFileName}");
                }
            }
            await _roomService.UpdateRoomAsync(room);
            return Ok(room);
        }

        [HttpDelete("{id}/images")]
        public async Task<IActionResult> DeleteImage(int id, [FromBody] string imageUrl)
        {
            var room = await _roomService.GetRoomByIdAsync(id);
            if (room == null) return NotFound();

            if (room.ImageUrls.Contains(imageUrl))
            {
                room.ImageUrls.Remove(imageUrl);
                await _roomService.UpdateRoomAsync(room);

                // Fiziksel dosyayı da sunucudan sil (İsteğe bağlı ama önerilir)
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", imageUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                    System.IO.File.Delete(filePath);
            }
            
            return Ok(room);
        }
    }
}