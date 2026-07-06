using otel_api.Models;
using otel_api.Repositories;

namespace otel_api.Services
{
    public class RoomService
    {
        private readonly RoomRepository _repo;
        public RoomService(RoomRepository repo) => _repo = repo;

        public async Task<List<Room>> GetRoomsAsync() => await _repo.GetAllAsync();

        public async Task<List<Room>> GetAvailableRoomsAsync(DateTime start, DateTime end) => 
            await _repo.GetAvailableRoomsAsync(start, end);

        public async Task<Room?> GetRoomByIdAsync(int id) => await _repo.GetByIdAsync(id);

        public async Task CreateRoomAsync(Room room) => await _repo.AddAsync(room);

        public async Task UpdateRoomAsync(Room room) => await _repo.UpdateAsync(room);

        public async Task DeleteRoomAsync(int id) => await _repo.DeleteAsync(id);
    }
}