using Microsoft.EntityFrameworkCore;
using otel_api.Data;
using otel_api.Models;

namespace otel_api.Repositories
{
    public class ReservationRepository
    {
        private readonly ApplicationDbContext _db;
        public ReservationRepository(ApplicationDbContext db) => _db = db;

        public async Task<List<Reservation>> GetAllAsync() => 
            await _db.Reservations.Include(r => r.Room).Include(r => r.Customer).ToListAsync();

        public async Task<List<Reservation>> GetByCustomerIdAsync(int customerId) => 
            await _db.Reservations.Include(r => r.Room).Include(r => r.Customer)
                .Where(r => r.CustomerId == customerId).ToListAsync();

        public async Task AddAsync(Reservation res)
        {
            await _db.Reservations.AddAsync(res);
            await _db.SaveChangesAsync();
        }

        public async Task<Reservation?> GetByIdAsync(int id) => 
            await _db.Reservations
                .Include(r => r.Room)
                .Include(r => r.Customer)
                .FirstOrDefaultAsync(r => r.Id == id);

        public async Task UpdateAsync(Reservation res)
        {
            _db.Reservations.Update(res);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var r = await _db.Reservations.FindAsync(id);
            if (r == null) return;
            _db.Reservations.Remove(r);
            await _db.SaveChangesAsync();
        }

        public async Task<bool> IsRoomBooked(int roomId, DateTime start, DateTime end, int? excludeReservationId = null) =>
            await _db.Reservations.AnyAsync(r => 
                r.RoomId == roomId && 
                r.CheckInDate < end && 
                r.CheckOutDate > start &&
                (!excludeReservationId.HasValue || r.Id != excludeReservationId.Value));
        public async Task<bool> HasActiveReservationForRoom(int roomId) =>
            await _db.Reservations.AnyAsync(r => r.RoomId == roomId && r.CheckOutDate >= DateTime.UtcNow);
    }
}