using otel_api.Models;
using otel_api.Repositories;

namespace otel_api.Services
{
    public class ReservationService
    {
        private readonly ReservationRepository _resRepo;
        private readonly RoomRepository _roomRepo;

        public ReservationService(ReservationRepository resRepo, RoomRepository roomRepo)
        {
            _resRepo = resRepo;
            _roomRepo = roomRepo;
        }

        public async Task<List<Reservation>> GetAllAsync() => await _resRepo.GetAllAsync();

        public async Task<Reservation?> GetByIdAsync(int id) => await _resRepo.GetByIdAsync(id);

        public async Task<(bool Success, string Message, Reservation? Data)> CreateReservation(Reservation res)
        {
            if (res.CheckInDate.Date < DateTime.Now.Date)
                return (false, "Geçmiş bir tarihe rezervasyon yapılamaz.", null);
                
            if (res == null)
                return (false, "Rezervasyon verisi eksik.", null);

            if (res.CustomerId <= 0 || res.RoomId <= 0)
                return (false, "Müşteri ve oda bilgisi zorunludur.", null);

            // Tarih kontrolü
            if (res.CheckOutDate <= res.CheckInDate)
                return (false, "Çıkış tarihi giriş tarihinden sonra olmalı.", null);

            // 1. Müsaitlik kontrolü
            if (await _resRepo.IsRoomBooked(res.RoomId, res.CheckInDate, res.CheckOutDate))
                return (false, "Seçilen tarihlerde oda dolu.", null);

            // 2. Oda bilgisi
            var room = await _roomRepo.GetByIdAsync(res.RoomId);
            if (room == null) return (false, "Oda bulunamadı.", null);

            // 3. Fiyat hesaplama
            int days = (res.CheckOutDate - res.CheckInDate).Days;
            res.TotalPrice = days * room.PricePerNight;

            // 4. Kayıt
            await _resRepo.AddAsync(res);
            return (true, "Başarılı", res);
        }

        public async Task<(bool Success, string Message)> UpdateReservationAsync(Reservation res)
        {
            if (res.CheckOutDate <= res.CheckInDate)
                return (false, "Çıkış tarihi giriş tarihinden sonra olmalı.");

            // Müsaitlik kontrolü (kendi rezervasyonunu hariç tut)
            if (await _resRepo.IsRoomBooked(res.RoomId, res.CheckInDate, res.CheckOutDate, res.Id))
                return (false, "Seçilen tarihlerde oda dolu.");

            // Recalculate price if dates/room changed
            var room = await _roomRepo.GetByIdAsync(res.RoomId);
            if (room == null) return (false, "Oda bulunamadı.");

            int days = (res.CheckOutDate - res.CheckInDate).Days;
            res.TotalPrice = days * room.PricePerNight;

            await _resRepo.UpdateAsync(res);
            return (true, "Başarılı");
        }

        public async Task DeleteReservationAsync(int id) => await _resRepo.DeleteAsync(id);
    }
}