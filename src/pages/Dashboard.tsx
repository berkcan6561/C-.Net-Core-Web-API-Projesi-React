import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { BedDouble, CalendarCheck, DollarSign, Trash2, Calendar, X, Activity } from 'lucide-react';

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  
  // Veriler (State)
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [accounting, setAccounting] = useState<any>(null);

  // Popup (Modal) için State
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Sayfa açıldığında verileri çek
  useEffect(() => {
    fetchRooms();
    fetchReservations();
    if (isAdmin) fetchAccounting();
  }, [isAdmin]);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diffTime = new Date(end).getTime() - new Date(start).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const totalDays = calculateDays(checkIn, checkOut);
  const totalPrice = selectedRoom ? totalDays * selectedRoom.pricePerNight : 0;

  const handleInitialSubmit = () => {
    if (!checkIn || !checkOut) {
      setBookingError('Lütfen giriş ve çıkış tarihlerini seçin.');
      return;
    }
    if (totalDays <= 0) {
      setBookingError('Çıkış tarihi giriş tarihinden sonra olmalıdır.');
      return;
    }
    setBookingError('');
    setShowConfirmation(true);
  };

  const fetchRooms = async () => {
    try {
      const res = await axiosInstance.get('/Room');
      setRooms(res.data);
    } catch (err) {}
  };

  const fetchReservations = async () => {
    try {
      const endpoint = isAdmin ? '/Reservation' : '/Reservation/my';
      const res = await axiosInstance.get(endpoint);
      setReservations(res.data);
    } catch (err) {}
  };

  const fetchAccounting = async () => {
    try {
      const res = await axiosInstance.get('/Accounting/revenue');
      setAccounting(res.data);
    } catch (err) {}
  };

  const handleBookRoom = async () => {
    if (!checkIn || !checkOut) {
      setBookingError('Lütfen giriş ve çıkış tarihlerini seçin.');
      return;
    }
    
    try {
      await axiosInstance.post('/Reservation', {
        customerId: user?.customerId,
        roomId: selectedRoom.id,
        checkInDate: checkIn,
        checkOutDate: checkOut
      });
      setSelectedRoom(null);
      setCheckIn(''); setCheckOut(''); setBookingError('');
      fetchReservations();
      setBookingError('');
      if (isAdmin) fetchAccounting();
    } catch (err: any) {
      setBookingError(err.response?.data || 'Seçilen tarihlerde oda dolu olabilir.');
      setShowConfirmation(false);
    }
  };

  const handleDeleteReservation = async (id: number) => {
    if (window.confirm("Bu rezervasyonu iptal etmek istediğinize emin misiniz?")) {
      try {
        await axiosInstance.delete(`/Reservation/${id}`);
        fetchReservations();
        if (isAdmin) fetchAccounting();
      } catch (err: any) {
        alert(err.response?.data || "İptal başarısız oldu.");
      }
    }
  };

  // Zaman kontrolleri için bugünün tarihi (Geçmişe kayıt/iptal engeli)
  const today = new Date().toISOString().split('T')[0];
  const isFutureDate = (dateStr: string) => {
    return new Date(dateStr) >= new Date(today);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. ADMIN'E ÖZEL MUHASEBE MODÜLÜ */}
      {isAdmin && accounting && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold">Toplam Gelir</p>
                <h3 className="text-2xl font-bold text-white">{accounting.totalRevenue} ₺</h3>
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold">Bu Ayki Gelir</p>
                <h3 className="text-2xl font-bold text-white">{accounting.currentMonthRevenue} ₺</h3>
              </div>
            </div>
            <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-600/10 border border-violet-500/20 p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                <CalendarCheck size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold">Toplam Rezervasyon</p>
                <h3 className="text-2xl font-bold text-white">{accounting.totalReservationsCount} Adet</h3>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="text-emerald-400" />  Gelir Geçmişi
            </h2>
            <div className="bg-[#131b2f] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">İşlem ID</th>
                    <th className="px-6 py-4">Oda No</th>
                    <th className="px-6 py-4">Müşteri Adı Soyadı</th>
                    <th className="px-6 py-4">Tarih Aralığı</th>
                    <th className="px-6 py-4 text-emerald-400">Kazanılan Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {accounting.details?.map((res: any) => (
                    <tr key={res.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">#{res.id}</td>
                      <td className="px-6 py-4">Oda {res.room?.roomNumber || res.roomId}</td>
                      <td className="px-6 py-4 font-bold text-cyan-300">
                        {res.customer ? `${res.customer.firstName} ${res.customer.lastName}` : `Müşteri ${res.customerId}`}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(res.checkInDate).toLocaleDateString('tr-TR')} - {new Date(res.checkOutDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-400">+{res.totalPrice} ₺</td>
                    </tr>
                  ))}
                  {(!accounting.details || accounting.details.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-slate-500">Henüz gelir kaydı yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ODALAR LİSTESİ */}
      {!isAdmin && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BedDouble className="text-cyan-400" /> Kiralayabileceğiniz Odalar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="bg-[#131b2f] border border-white/5 rounded-2xl p-5 hover:border-cyan-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/5 text-slate-300 text-xs px-3 py-1 rounded-full border border-white/10">
                    Oda {room.roomNumber}
                  </span>
                  <span className="text-cyan-400 font-bold">{room.pricePerNight} ₺ <span className="text-[10px] text-slate-500 font-normal">/gece</span></span>
                </div>
                <h3 className="text-white font-medium mb-1">Kapasite: {room.capacity} Kişi</h3>
                
                <button 
                  onClick={() => setSelectedRoom(room)}
                  className="w-full mt-4 bg-cyan-500/10 text-cyan-400 font-medium py-2 rounded-xl border border-cyan-500/20 hover:bg-cyan-500 hover:text-white transition-all text-sm"
                >
                  Hemen Seç
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. REZERVASYONLAR (Müşteri için kendi, Admin için tümü) */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 mt-10">
          <Calendar className="text-violet-400" /> {isAdmin ? 'Tüm Rezervasyon Yönetimi' : 'Geçmiş ve Aktif Rezervasyonlarım'}
        </h2>
        
        {reservations.length === 0 ? (
          <div className="text-slate-500 text-sm p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
            Henüz hiç rezervasyon bulunmuyor.
          </div>
        ) : (
          <div className="bg-[#131b2f] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Oda No</th>
                  {isAdmin && <th className="px-6 py-4">Müşteri Adı Soyadı</th>}
                  <th className="px-6 py-4">Giriş Tarihi</th>
                  <th className="px-6 py-4">Çıkış Tarihi</th>
                  <th className="px-6 py-4 text-emerald-400">Ödenen Tutar</th>
                  <th className="px-6 py-4 text-right">Durum / İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reservations.map((res) => {
                  const canCancel = isFutureDate(res.checkInDate) || isAdmin; 
                  return (
                    <tr key={res.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">Oda {res.room?.roomNumber || res.roomId}</td>
                      {isAdmin && <td className="px-6 py-4 font-semibold text-cyan-300">
                        {res.customer ? `${res.customer.firstName} ${res.customer.lastName}` : `Müşteri ${res.customerId}`}
                      </td>}
                      <td className="px-6 py-4">{new Date(res.checkInDate).toLocaleDateString('tr-TR')}</td>
                      <td className="px-6 py-4">{new Date(res.checkOutDate).toLocaleDateString('tr-TR')}</td>
                      <td className="px-6 py-4 font-bold text-white">{res.totalPrice} ₺</td>
                      <td className="px-6 py-4 text-right">
                        {canCancel ? (
                          <button 
                            onClick={() => handleDeleteReservation(res.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 p-2 rounded-lg transition-colors ml-auto"
                            title="İptal Et / Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs bg-slate-800 px-3 py-1 rounded-lg">Geçmiş/Tamamlandı</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131b2f] border border-white/10 rounded-3xl p-8 w-full max-w-md relative shadow-2xl animate-slide-in">
            <button 
              onClick={() => { setSelectedRoom(null); setBookingError(''); setShowConfirmation(false); }}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-2">Rezervasyon Yap</h2>
            <p className="text-slate-400 text-sm mb-6">Oda {selectedRoom.roomNumber} ({selectedRoom.pricePerNight} ₺ / gece)</p>

            {bookingError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm mb-4">
                {bookingError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Giriş Tarihi</label>
                <input 
                  type="date" 
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Çıkış Tarihi</label>
                <input 
                  type="date" 
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500" 
                />
              </div>
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-cyan-100">Kalış Süresi:</span>
                  <span className="text-sm font-bold text-cyan-400">{totalDays} Gece</span>
                </div>
                <div className="flex justify-between items-center border-t border-cyan-500/20 pt-2 mt-2">
                  <span className="text-sm text-cyan-100">Toplam Fiyat:</span>
                  <span className="text-lg font-bold text-white">{totalPrice} ₺</span>
                </div>
              </div>

              <button 
                onClick={handleInitialSubmit} 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 mt-2"
              >
                Onayla ve Kirala
              </button>
            </div>
          </div>
        </div>
      )}
              {/* 5. ONAY POPUP (Emin misiniz ekranı) */}
      {showConfirmation && selectedRoom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-[#131b2f] border border-cyan-500/30 rounded-3xl p-8 w-full max-w-sm text-center shadow-[0_0_40px_rgba(6,182,212,0.15)] animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Rezervasyonu Onaylıyor musunuz?</h2>
            
            <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left space-y-2">
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Oda:</span> Oda {selectedRoom.roomNumber}
              </p>
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Tarih:</span> {new Date(checkIn).toLocaleDateString('tr-TR')} - {new Date(checkOut).toLocaleDateString('tr-TR')}
              </p>
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Süre:</span> {totalDays} Gece
              </p>
              <div className="border-t border-white/10 pt-2 mt-2">
                <p className="text-lg font-bold text-emerald-400 text-center">
                  Toplam: {totalPrice} ₺
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-slate-800 text-slate-300 font-medium py-3 rounded-xl hover:bg-slate-700 transition-all text-sm"
              >
                Vazgeç
              </button>
              <button 
                onClick={handleBookRoom}
                className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-3 rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-sm shadow-lg shadow-emerald-500/20"
              >
                Evet, Onaylıyorum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}