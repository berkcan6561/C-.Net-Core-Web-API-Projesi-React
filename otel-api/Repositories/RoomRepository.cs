using Microsoft.EntityFrameworkCore;
using otel_api.Data;
using otel_api.Models;

namespace otel_api.Repositories
{
    public class RoomRepository
    {
        private readonly ApplicationDbContext _db;
        public RoomRepository(ApplicationDbContext db) => _db = db;

        public async Task<Room?> GetByIdAsync(int id) => await _db.Rooms.FindAsync(id);
        public async Task<List<Room>> GetAllAsync() => await _db.Rooms.ToListAsync();
        
        public async Task<List<Room>> GetAvailableRoomsAsync(DateTime start, DateTime end)
        {
            var bookedRoomIds = await _db.Reservations
                .Where(r => r.CheckInDate < end && r.CheckOutDate > start)
                .Select(r => r.RoomId)
                .Distinct()
                .ToListAsync();

            return await _db.Rooms
                .Where(r => !bookedRoomIds.Contains(r.Id))
                .ToListAsync();
        }

        public async Task AddAsync(Room room)
        {
            await _db.Rooms.AddAsync(room);
            await _db.SaveChangesAsync();
        }

        public async Task UpdateAsync(Room room)
        {
            _db.Rooms.Update(room);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var room = await _db.Rooms.FindAsync(id);
            if (room == null) return;
            _db.Rooms.Remove(room);
            await _db.SaveChangesAsync();
        }
    }
}