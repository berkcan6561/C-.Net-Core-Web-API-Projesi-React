using otel_api.Models;
using otel_api.Repositories;

namespace otel_api.Services
{
    public class RoomService
    {
        private readonly RoomRepository _repo;
        private readonly ReservationRepository _resRepo;

        public RoomService(RoomRepository repo, ReservationRepository resRepo)
        {
            _repo = repo;
            _resRepo = resRepo;
        }

        public async Task<List<Room>> GetRoomsAsync() => await _repo.GetAllAsync();

        public async Task<List<Room>> GetAvailableRoomsAsync(DateTime start, DateTime end) =>
            await _repo.GetAvailableRoomsAsync(start, end);

        public async Task<Room?> GetRoomByIdAsync(int id) => await _repo.GetByIdAsync(id);

        public async Task CreateRoomAsync(Room room) => await _repo.AddAsync(room);

        public async Task UpdateRoomAsync(Room room) => await _repo.UpdateAsync(room);

        public async Task<(bool Success, string Message)> DeleteRoomAsync(int id)
        {
            if (await _resRepo.HasActiveReservationForRoom(id))
                return (false, "Bu odaya ait aktif rezervasyonlar bulunduğu için silinemez.");

            await _repo.DeleteAsync(id);
            return (true, "Oda başarıyla silindi.");
        }
    }
}