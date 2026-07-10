using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using otel_api.Services;
using System.Linq;

namespace otel_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AccountingController : ControllerBase
    {
        private readonly ReservationService _reservationService;

        public AccountingController(ReservationService reservationService)
        {
            _reservationService = reservationService;
        }
         [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenueStats()
        {
            var reservations = await _reservationService.GetAllAsync();
            var totalRevenue = reservations.Sum(r => r.TotalPrice);
            var currentMonthRevenue = reservations.Where(r => r.CheckInDate.Month == DateTime.Now.Month && r.CheckInDate.Year == DateTime.Now.Year).Sum(r => r.TotalPrice);
            return Ok(new
            {
                TotalRevenue = totalRevenue,
                CurrentMonthRevenue = currentMonthRevenue,
                TotalReservationsCount = reservations.Count,
                // İŞTE BURASI: Gelirin detaylı listesi (Kim, hangi oda, ne kadar ödedi)
                Details = reservations.OrderByDescending(r => r.CheckInDate).Select(r => new {
                    r.Id,
                    r.RoomId,
                    r.CustomerId,
                    r.CheckInDate,
                    r.CheckOutDate,
                    r.TotalPrice
                }).ToList()
            });
        }
    }
}