using otel_api.Models;
using otel_api.Repositories;

namespace otel_api.Services
{
    public class ReservationService
    {
        private readonly ReservationRepository _resRepo;
        private readonly RoomRepository _roomRepo;
        private readonly CustomerRepository _customerRepo;
        private readonly EmailService _emailService;
        private readonly otel_api.Data.ApplicationDbContext _db;

        public ReservationService(ReservationRepository resRepo, RoomRepository roomRepo, CustomerRepository customerRepo, EmailService emailService, otel_api.Data.ApplicationDbContext db)
        {
            _resRepo = resRepo;
            _roomRepo = roomRepo;
            _customerRepo = customerRepo;
            _emailService = emailService;
            _db = db;
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

            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                // 1. Müsaitlik kontrolü (Kilitli okuma)
                if (await _resRepo.IsRoomBooked(res.RoomId, res.CheckInDate, res.CheckOutDate))
                    return (false, "Seçilen tarihlerde oda dolu.", null);

                // 2. Oda bilgisi
                var room = await _roomRepo.GetByIdAsync(res.RoomId);
                if (room == null) return (false, "Oda bulunamadı.", null);

                // 3. Fiyat hesaplama
                int days = (res.CheckOutDate.Date - res.CheckInDate.Date).Days;
                res.TotalPrice = days * room.PricePerNight;

                // 4. Kayıt
                await _resRepo.AddAsync(res);
                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return (false, "Rezervasyon sırasında sistemsel bir hata oluştu veya oda başka biri tarafından rezerve edildi.", null);
            }

            // 5. E-posta Gönderimi
            var customer = await _customerRepo.GetByIdAsync(res.CustomerId);
            var roomDetails = await _roomRepo.GetByIdAsync(res.RoomId);
            if (customer != null && roomDetails != null && !string.IsNullOrEmpty(customer.Email))
            {
                var mailBody = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;'>
                        <div style='text-align: center; margin-bottom: 24px;'>
                            <h1 style='color: #0f172a; margin: 0; font-size: 24px; font-weight: bold;'>The Luna Suites</h1>
                            <p style='color: #64748b; margin-top: 4px; font-size: 14px;'>Hotel & Residences</p>
                        </div>
                        <div style='background-color: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>
                            <h2 style='color: #1e293b; margin-top: 0; font-size: 20px;'>Rezervasyonunuz Onaylandı! 🎉</h2>
                            <p style='color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 24px;'>
                                Sayın {customer.FirstName} {customer.LastName},<br><br>
                                Bizi tercih ettiğiniz için teşekkür ederiz. {roomDetails.RoomNumber} numaralı odamız için rezervasyon işleminiz başarıyla tamamlanmıştır.
                            </p>
                            <div style='background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;'>
                                <p style='margin: 6px 0; color: #334155;'><strong>Oda Numarası:</strong> {roomDetails.RoomNumber}</p>
                                <p style='margin: 6px 0; color: #334155;'><strong>Giriş Tarihi:</strong> {res.CheckInDate:dd.MM.yyyy}</p>
                                <p style='margin: 6px 0; color: #334155;'><strong>Çıkış Tarihi:</strong> {res.CheckOutDate:dd.MM.yyyy}</p>
                                <p style='margin: 6px 0; color: #334155; font-size: 18px;'><strong>Toplam Ücret:</strong> {res.TotalPrice} ₺</p>
                            </div>
                            <p style='color: #64748b; font-size: 14px; text-align: center; margin-bottom: 0;'>
                                Giriş işlemleri için otelimize geldiğinizde kimliğinizi ibraz etmeniz yeterlidir. Sizi ağırlamak için sabırsızlanıyoruz!
                            </p>
                        </div>
                        <div style='text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;'>
                            &copy; {DateTime.Now.Year} The Luna Suites Hotel. Tüm hakları saklıdır.
                        </div>
                    </div>";

                await _emailService.SendEmailAsync(customer.Email, "The Luna Suites - Rezervasyon Onayı", mailBody);
            }

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

        public async Task DeleteReservationAsync(int id)
        {
            var res = await _resRepo.GetByIdAsync(id);
            if (res != null)
            {
                var customer = await _customerRepo.GetByIdAsync(res.CustomerId);
                var room = await _roomRepo.GetByIdAsync(res.RoomId);

                await _resRepo.DeleteAsync(id);

                if (customer != null && room != null && !string.IsNullOrEmpty(customer.Email))
                {
                    var mailBody = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fcf1f1; border-radius: 12px; border: 1px solid #fee2e2;'>
                            <div style='text-align: center; margin-bottom: 24px;'>
                                <h1 style='color: #7f1d1d; margin: 0; font-size: 24px; font-weight: bold;'>The Luna Suites</h1>
                                <p style='color: #991b1b; margin-top: 4px; font-size: 14px;'>Hotel & Residences</p>
                            </div>
                            <div style='background-color: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-top: 4px solid #ef4444;'>
                                <h2 style='color: #1e293b; margin-top: 0; font-size: 20px;'>Rezervasyonunuz İptal Edildi</h2>
                                <p style='color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 24px;'>
                                    Sayın {customer.FirstName} {customer.LastName},<br><br>
                                    Aşağıda detayları bulunan rezervasyonunuz iptal edilmiştir.
                                </p>
                                <div style='background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;'>
                                    <p style='margin: 6px 0; color: #334155;'><strong>Oda Numarası:</strong> {room.RoomNumber}</p>
                                    <p style='margin: 6px 0; color: #334155;'><strong>Giriş Tarihi:</strong> {res.CheckInDate:dd.MM.yyyy}</p>
                                    <p style='margin: 6px 0; color: #334155;'><strong>Çıkış Tarihi:</strong> {res.CheckOutDate:dd.MM.yyyy}</p>
                                </div>
                                <p style='color: #64748b; font-size: 14px; text-align: center; margin-bottom: 0;'>
                                    Bu işlem bir hata sonucu gerçekleştiyse veya fikrinizi değiştirdiyseniz lütfen bizimle iletişime geçin. Sizi tekrar aramızda görmekten mutluluk duyarız.
                                </p>
                            </div>
                            <div style='text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;'>
                                &copy; {DateTime.Now.Year} The Luna Suites Hotel. Tüm hakları saklıdır.
                            </div>
                        </div>";

                    await _emailService.SendEmailAsync(customer.Email, "The Luna Suites - Rezervasyon İptali", mailBody);
                }
            }
        }
    }
}