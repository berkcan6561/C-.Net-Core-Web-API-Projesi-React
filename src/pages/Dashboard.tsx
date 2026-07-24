import { useState, useEffect } from 'react';
import lunaLogo from '../assets/luna-logo.png';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { BedDouble, CalendarCheck, DollarSign, Trash2, Calendar, X, Activity, ArrowRight, FileText } from 'lucide-react';
import { RoomCarousel } from '../components/RoomCarousel';
import { useCurrency } from '../context/CurrencyContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { formatPrice } = useCurrency();
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [accounting, setAccounting] = useState<any>(null);

  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // PDF state
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async (res: any) => {
    setInvoiceData(res);
    setTimeout(() => {
      const element = document.getElementById('pdf-invoice-template-dashboard');
      if (element) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                            .map(s => s.outerHTML).join('');
                            
        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(`
            <html>
              <head>
                <title>Fatura_LunaSuites_${res.id}</title>
                <base href="${window.location.origin}">
                ${styles}
                <style>
                  @page { margin: 0mm; }
                  body { margin: 0; }
                </style>
              </head>
              <body class="bg-white p-10">
                ${element.innerHTML}
              </body>
            </html>
          `);
          doc.close();
          
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
              setInvoiceData(null);
            }, 1000);
          }, 500);
        }
      }
    }, 100);
  };


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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReservations();
    if (isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAccounting();
    }
  }, [isAdmin]);

  const handleBookRoom = async () => {
    if (!checkIn || !checkOut || isBooking) return;
    setIsBooking(true);
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
      if (isAdmin) fetchAccounting();
    } catch (err: any) {
      if (err.response?.status === 429) {
        setBookingError('Çok fazla işlem yaptınız. Lütfen daha sonra tekrar deneyin.');
      } else {
        setBookingError(err.response?.data || 'Seçilen tarihlerde oda dolu olabilir.');
      }
    } finally {
      setIsBooking(false);
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

  const today = new Date().toISOString().split('T')[0];
  const isFutureDate = (dateStr: string) => new Date(dateStr) >= new Date(today);

  // 1. AYLIK CİRO HESAPLAMASI (ÇİZGİ/ALAN GRAFİĞİ İÇİN)
  const monthlyRevenue = accounting?.details?.reduce((acc: any, curr: any) => {
    const month = new Date(curr.checkInDate).toLocaleString('tr-TR', { month: 'short' });
    const existingMonth = acc.find((item: any) => item.name === month);
    if (existingMonth) {
      existingMonth.ciro += curr.totalPrice;
    } else {
      acc.push({ name: month, ciro: curr.totalPrice });
    }
    return acc;
  }, []) || [];

  // 2. EN ÇOK TERCİH EDİLEN ODALAR (PASTA GRAFİĞİ İÇİN)
  const roomPopularity = accounting?.details?.reduce((acc: any, curr: any) => {
    const roomName = `Oda ${curr.room?.roomNumber || curr.roomId}`;
    const existingRoom = acc.find((item: any) => item.name === roomName);
    if (existingRoom) {
      existingRoom.value += 1;
    } else {
      acc.push({ name: roomName, value: 1 });
    }
    return acc;
  }, []) || [];

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  return (
    // Ana konteynere sayfa yüklendiğinde hafifçe belirmesi için fade-in animasyonu ekledik
    <div className="space-y-10 animate-fade-in">
      
      {/* BAŞLIK (Premium Gradient Efektli) */}
      <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
          {isAdmin ? 'Yönetim Paneli Özeti' : 'Hoş Geldiniz, ' + (user?.fullName || '')}
        </h1>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          {isAdmin ? 'Otelin genel durumunu ve finansal verileri buradan takip edebilirsiniz.' : 'Aşağıdan odalarımızı inceleyebilir ve rezervasyon yapabilirsiniz.'}
        </p>
      </div>

      {/* 1. ADMIN'E ÖZEL MUHASEBE MODÜLÜ */}
      {isAdmin && accounting && (
        <div className="space-y-8">
          {/* İstatistik Kartları - Hover ile havaya kalkma efektli */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Kart 1 */}
            <div className="group bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                <DollarSign size={28} className="group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">Toplam Gelir</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(accounting.totalRevenue)}</h3>
              </div>
            </div>

            {/* Kart 2 */}
            <div className="group bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.3s' }}>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <Activity size={28} className="group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">Bu Ayki Gelir</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(accounting.currentMonthRevenue)}</h3>
              </div>
            </div>

            {/* Kart 3 */}
            <div className="group bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.4s' }}>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <CalendarCheck size={28} className="group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">Rezervasyon</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{accounting.totalReservationsCount} Adet</h3>
              </div>
            </div>

          </div>

          {/* GRAFİKLER BÖLÜMÜ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in" style={{ animationDelay: '0.45s' }}>
            
            {/* Alan (Çizgi) Grafiği: Aylık Ciro */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Activity className="text-blue-500 w-5 h-5" /> Aylık Gelir Trendi
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `₺${val}`} />
                    <RechartsTooltip 
                      formatter={(value: any) => [formatPrice(value), 'Ciro']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area type="monotone" dataKey="ciro" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCiro)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pasta Grafiği: Oda Popülerliği */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BedDouble className="text-emerald-500 w-5 h-5" /> Oda Tercih Dağılımı
              </h2>
              <div className="h-72 w-full flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomPopularity}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {roomPopularity.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value} Kez Kiralandı`, 'Tercih Edilme']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>

          {/* Gelir Geçmişi Tablosu */}
          <div className="animate-slide-in" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="text-blue-500 w-5 h-5" /> Son İşlemler
            </h2>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">İşlem ID</th>
                    <th className="px-6 py-4">Oda No</th>
                    <th className="px-6 py-4">Müşteri</th>
                    <th className="px-6 py-4">Tarih Aralığı</th>
                    <th className="px-6 py-4 text-emerald-600">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounting.details?.map((res: any) => (
                    // Satır Hover Efekti
                    <tr key={res.id} className="hover:bg-blue-50/50 transition-colors group cursor-default">
                      <td className="px-6 py-4 font-medium text-slate-500">#{res.id}</td>
                      <td className="px-6 py-4">Oda {res.room?.roomNumber || res.roomId}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {res.customer ? `${res.customer.firstName} ${res.customer.lastName}` : `Müşteri ${res.customerId}`}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(res.checkInDate).toLocaleDateString('tr-TR')} - {new Date(res.checkOutDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">+{formatPrice(res.totalPrice)}</td>
                    </tr>
                  ))}
                  {(!accounting.details || accounting.details.length === 0) && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Kayıt yok.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. MÜŞTERİLER İÇİN ODA LİSTESİ */}
      {!isAdmin && (
        <div className="mt-8 animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BedDouble className="text-blue-500 w-5 h-5" /> Kiralayabileceğiniz Odalar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {rooms.map((room, idx) => (
              // Oda Kartı Hover Animasyonu
              <div 
                key={room.id} 
                className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-2xl hover:-translate-y-2 hover:border-blue-200 transition-all duration-300 animate-slide-in"
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                <RoomCarousel imageUrls={room.imageUrls} />
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                    Oda {room.roomNumber}
                  </span>
                  <span className="text-blue-600 font-bold text-xl">{formatPrice(room.pricePerNight)} <span className="text-xs text-slate-400 font-normal">/gece</span></span>
                </div>
                <h3 className="text-slate-700 font-medium mb-1">Kapasite: {room.capacity} Kişi</h3>
                
                <button 
                  onClick={() => setSelectedRoom(room)}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-slate-50 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 text-sm"
                >
                  Rezervasyon Yap
                  <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. REZERVASYON TABLOSU */}
      <div className="pt-6 animate-slide-in" style={{ animationDelay: isAdmin ? '0.6s' : '0.4s' }}>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="text-purple-500 w-5 h-5" /> {isAdmin ? 'Tüm Rezervasyonlar' : 'Rezervasyonlarım'}
        </h2>
        
        {reservations.length === 0 ? (
          <div className="text-slate-500 text-sm p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
            Henüz hiç rezervasyon bulunmuyor.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Oda No</th>
                  {isAdmin && <th className="px-6 py-4">Müşteri</th>}
                  <th className="px-6 py-4">Giriş Tarihi</th>
                  <th className="px-6 py-4">Çıkış Tarihi</th>
                  <th className="px-6 py-4 text-slate-900">Tutar</th>
                  <th className="px-6 py-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((res) => {
                  const canCancel = isFutureDate(res.checkInDate) || isAdmin; 
                  return (
                    // Tablo Satırı Hover
                    <tr key={res.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-medium">Oda {res.room?.roomNumber || res.roomId}</td>
                      {isAdmin && <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {res.customer ? `${res.customer.firstName} ${res.customer.lastName}` : `Müşteri ${res.customerId}`}
                      </td>}
                      <td className="px-6 py-4">{new Date(res.checkInDate).toLocaleDateString('tr-TR')}</td>
                      <td className="px-6 py-4">{new Date(res.checkOutDate).toLocaleDateString('tr-TR')}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatPrice(res.totalPrice)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownloadPdf(res)}
                            disabled={isGeneratingPdf}
                            className="p-2 text-blue-400 hover:text-white hover:bg-blue-500 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
                            title="PDF Fiş İndir"
                          >
                            <FileText size={18} />
                          </button>
                          {canCancel ? (
                            <button 
                              onClick={() => handleDeleteReservation(res.id)}
                              className="text-red-400 hover:text-white hover:bg-red-500 p-2 rounded-lg transition-all inline-flex items-center shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              title="İptal Et"
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">TAMAMLANDI</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REZERVASYON MODALI */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-md relative shadow-2xl animate-slide-in">
            <button 
              onClick={() => { setSelectedRoom(null); setBookingError(''); setShowConfirmation(false); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all hover:rotate-90"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Rezervasyon Yap</h2>
            <p className="text-slate-500 text-sm mb-6">Oda {selectedRoom.roomNumber} &bull; <span className="font-semibold text-blue-600">{formatPrice(selectedRoom.pricePerNight)} / gece</span></p>

            {bookingError && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm mb-5 font-medium animate-slide-in">
                {bookingError}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giriş Tarihi</label>
                <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all hover:border-slate-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Çıkış Tarihi</label>
                <input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all hover:border-slate-300" />
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mt-4 transition-all">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-blue-800 font-medium">Kalış Süresi:</span>
                  <span className="text-sm font-bold text-blue-700">{totalDays} Gece</span>
                </div>
                <div className="flex justify-between items-center border-t border-blue-200/60 pt-3">
                  <span className="text-sm text-blue-800 font-medium">Toplam Fiyat:</span>
                  <span className="text-xl font-bold text-blue-700 transition-all">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button 
                onClick={handleInitialSubmit} 
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all mt-2"
              >
                Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONAY MODALI */}
      {showConfirmation && selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-slide-in">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Onaylıyor musunuz?</h2>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 text-left space-y-3">
              <p className="text-sm text-slate-700"><span className="text-slate-500 w-16 inline-block">Oda:</span> <span className="font-semibold text-slate-900">Oda {selectedRoom.roomNumber}</span></p>
              <p className="text-sm text-slate-700"><span className="text-slate-500 w-16 inline-block">Tarih:</span> <span className="font-semibold text-slate-900">{new Date(checkIn).toLocaleDateString('tr-TR')} - {new Date(checkOut).toLocaleDateString('tr-TR')}</span></p>
              <p className="text-sm text-slate-700"><span className="text-slate-500 w-16 inline-block">Süre:</span> <span className="font-semibold text-slate-900">{totalDays} Gece</span></p>
              <div className="border-t border-slate-200 pt-3 mt-1">
                <p className="text-xl font-black text-emerald-600 text-center">
                  Toplam: {formatPrice(totalPrice)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmation(false)} 
                disabled={isBooking}
                className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button 
                onClick={handleBookRoom} 
                disabled={isBooking}
                className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50 flex items-center justify-center"
              >
                {isBooking ? 'Onaylanıyor...' : 'Onaylıyorum'}
              </button>
            </div>
          </div>
        </div>
      )}
    {/* GİZLİ PDF ŞABLONU */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none w-[800px] h-[800px] overflow-hidden">
        <div id="pdf-invoice-template-dashboard" className="w-[800px] bg-white p-12 text-slate-800 font-sans">
          
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
            <div className="flex items-center gap-4">
              <img src={lunaLogo} alt="Luna Suites" className="w-24 h-24 object-contain" />
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">THE LUNA SUITES</h1>
                <p className="text-slate-500 font-medium uppercase tracking-widest text-xs mt-1">Hotel & Residences</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-5xl font-black text-slate-100 uppercase tracking-widest mb-2">FATURA</h2>
              <p className="text-slate-500 font-bold">Kayıt No: #{invoiceData?.id?.toString().padStart(6, '0')}</p>
              <p className="text-slate-400 text-sm mt-1">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
            </div>
          </div>

          <div className="flex justify-between mb-12 bg-slate-50 p-6 rounded-2xl">
            <div>
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Sayın</h3>
              <p className="text-xl font-bold text-slate-800">{invoiceData?.customer?.firstName || user?.fullName?.split(' ')[0]} {invoiceData?.customer?.lastName || (user?.fullName?.split(' ').slice(1).join(' '))}</p>
              <p className="text-slate-500 font-medium mt-1">{invoiceData?.customer?.email}</p>
              <p className="text-slate-500 font-medium">{invoiceData?.customer?.phoneNumber}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3">Hizmet Sağlayıcı</h3>
              <p className="text-lg font-bold text-slate-800">The Luna Suites Hotel</p>
              <p className="text-slate-500 font-medium mt-1">Kışla Mahallesi, 4481. Sokak No:9</p>
              <p className="text-slate-500 font-medium">Yüreğir / Adana</p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 border-b-2 border-slate-100 pb-3">Konaklama Detayları</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-4">Hizmet / Oda</th>
                  <th className="pb-4">Check-In</th>
                  <th className="pb-4">Check-Out</th>
                  <th className="pb-4 text-center">Gece</th>
                  <th className="pb-4 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="text-slate-800 font-bold border-b-2 border-slate-100">
                <tr>
                  <td className="py-5">Premium Oda {invoiceData?.room?.roomNumber || invoiceData?.roomId} <span className="block text-xs text-slate-400 font-medium mt-1">({invoiceData?.room?.capacity || '-'} Kişilik Kapasite)</span></td>
                  <td className="py-5">{invoiceData ? new Date(invoiceData.checkInDate).toLocaleDateString('tr-TR') : ''}</td>
                  <td className="py-5">{invoiceData ? new Date(invoiceData.checkOutDate).toLocaleDateString('tr-TR') : ''}</td>
                  <td className="py-5 text-center text-slate-500">
                    {invoiceData ? Math.max(1, Math.floor((new Date(invoiceData.checkOutDate).getTime() - new Date(invoiceData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))) : 0}
                  </td>
                  <td className="py-5 text-right">{invoiceData ? formatPrice(invoiceData.totalPrice) : ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-16">
            <div className="bg-slate-900 p-8 rounded-3xl w-80 text-white shadow-xl">
              <div className="flex justify-between items-center text-slate-400 mb-5 font-medium border-b border-slate-700 pb-5 text-sm">
                <span>Ara Toplam</span>
                <span>{invoiceData ? formatPrice(invoiceData.totalPrice) : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-300">Ödenen Tutar</span>
                <span className="text-3xl font-black text-amber-400">{invoiceData ? formatPrice(invoiceData.totalPrice) : ''}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-slate-800 font-bold text-lg mb-1">Bizi tercih ettiğiniz için teşekkür ederiz.</p>
            <p className="text-slate-400 font-medium text-sm">Bir sonraki konaklamanızda görüşmek dileğiyle.</p>
          </div>
        </div>
      </div>
    </div>
  );
}