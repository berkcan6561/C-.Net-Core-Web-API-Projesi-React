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
        [AllowAnonymous]
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
        
        [AllowAnonymous]
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
        public async Task<IActionResult> Create([FromBody] otel_api.DTOs.RoomCreateDTO dto)
        {
            var room = new Room
            {
                RoomNumber = dto.RoomNumber,
                PricePerNight = dto.PricePerNight,
                Capacity = dto.Capacity,
                ImageUrls = new List<string>()
            };
            await _roomService.CreateRoomAsync(room);
            return CreatedAtAction(nameof(GetById), new { id = room.Id }, room);
        }

        // PUT: api/room/5 -> SADECE ADMIN FİYAT/BİLGİ GÜNCELLEYEBİLİR
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] otel_api.DTOs.RoomCreateDTO dto)
        {
            var existing = await _roomService.GetRoomByIdAsync(id);
            if (existing == null) return NotFound("Oda bulunamadı.");

            existing.RoomNumber = dto.RoomNumber;
            existing.PricePerNight = dto.PricePerNight;
            existing.Capacity = dto.Capacity;

            await _roomService.UpdateRoomAsync(existing);
            return NoContent();
        }

        // DELETE: api/room/5 -> SADECE ADMIN SİLEBİLİR
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _roomService.DeleteRoomAsync(id);
            if (!result.Success) return BadRequest(result.Message);
            return NoContent();
        }
        
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/images")]
        public async Task<IActionResult> UploadImages(int id, [FromForm] IFormFileCollection files)
        {
            var room = await _roomService.GetRoomByIdAsync(id);
            if (room == null) return NotFound();

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var allowedMimeTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "rooms");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            foreach (var file in files)
            {
                if (file.Length <= 0) continue;
                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest($"Dosya '{file.FileName}' 5 MB sınırını aşıyor.");

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(ext))
                    return BadRequest($"Dosya '{file.FileName}' geçersiz uzantıya sahip. Sadece resim dosyaları yükleyebilirsiniz.");

                if (!allowedMimeTypes.Contains(file.ContentType.ToLower()))
                    return BadRequest($"Dosya '{file.FileName}' geçersiz dosya türüne sahip.");

                var uniqueFileName = Guid.NewGuid().ToString() + ext;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                room.ImageUrls.Add($"/images/rooms/{uniqueFileName}");
            }
            await _roomService.UpdateRoomAsync(room);
            return Ok(room);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}/images")]
        public async Task<IActionResult> DeleteImage(int id, [FromBody] string imageUrl)
        {
            var room = await _roomService.GetRoomByIdAsync(id);
            if (room == null) return NotFound();

            if (room.ImageUrls.Contains(imageUrl))
            {
                room.ImageUrls.Remove(imageUrl);
                await _roomService.UpdateRoomAsync(room);

                // Path traversal koruması: Sadece dosya adını al, üst dizinlere erişimi engelle
                var safeFileName = Path.GetFileName(imageUrl.TrimStart('/'));
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "rooms");
                var filePath = Path.Combine(uploadsFolder, safeFileName);
                
                // Dosya yolunun uploads klasörü içinde olduğunu doğrula
                if (filePath.StartsWith(uploadsFolder) && System.IO.File.Exists(filePath))
                    System.IO.File.Delete(filePath);
            }
            
            return Ok(room);
        }
    }
}