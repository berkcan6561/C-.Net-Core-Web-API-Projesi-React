using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using otel_api.Services;
using System.Linq;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using otel_api.Data;

namespace otel_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    [EnableRateLimiting("TokenBucketNavigation")]
    public class AccountingController : ControllerBase
    {
        private readonly ReservationService _reservationService;
        private readonly ApplicationDbContext _db;

        public AccountingController(ReservationService reservationService, ApplicationDbContext db)
        {
            _reservationService = reservationService;
            _db = db;
        }
[HttpGet("revenue")]
public async Task<IActionResult> GetRevenueStats()
{
    var now = DateTime.UtcNow;

    var totalRevenue = await _db.Reservations.SumAsync(r => r.TotalPrice);

    var currentMonthRevenue = await _db.Reservations
        .Where(r => r.CheckInDate.Month == now.Month && r.CheckInDate.Year == now.Year)
        .SumAsync(r => r.TotalPrice);

    var totalCount = await _db.Reservations.CountAsync();

    var details = await _db.Reservations
        .Include(r => r.Room)
        .Include(r => r.Customer)
        .OrderByDescending(r => r.CheckInDate)
        .Take(100) // Son 100 kayıt yeterli, tümünü çekme
        .Select(r => new {
            r.Id,
            r.RoomId,
            Room = r.Room != null ? new { r.Room.RoomNumber } : null,
            r.CustomerId,
            Customer = r.Customer != null ? new { r.Customer.FirstName, r.Customer.LastName } : null,
            r.CheckInDate,
            r.CheckOutDate,
            r.TotalPrice
        }).ToListAsync();

    return Ok(new
    {
        TotalRevenue = totalRevenue,
        CurrentMonthRevenue = currentMonthRevenue,
        TotalReservationsCount = totalCount,
        Details = details
    });
}
    }
}