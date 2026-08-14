import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import lunaLogo from '../assets/luna-logo.png';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { BedDouble, CalendarCheck, DollarSign, Trash2, Calendar, X, Activity, ArrowRight, FileText } from 'lucide-react';
import { RoomCarousel } from '../components/RoomCarousel';
import { useCurrency } from '../context/CurrencyContext';
import { useTranslation } from 'react-i18next';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import type { Room } from '../types/room';
import type { Reservation } from '../types/reservation';

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { formatPrice } = useCurrency();
  const { t, i18n } = useTranslation();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [accounting, setAccounting] = useState<any>(null);

  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // PDF state
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [isGeneratingPdf, _setIsGeneratingPdf] = useState(false);

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
                <title>${t('dashboard.invoice.title')}_LunaSuites_${res.id}</title>
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
    toast((tToast) => (
      <div>
        <p className="mb-3 font-semibold">Bu rezervasyonu iptal etmek istediğinize emin misiniz?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(tToast.id)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-bold">Vazgeç</button>
          <button 
            onClick={async () => {
              toast.dismiss(tToast.id);
              try {
                await axiosInstance.delete(`/Reservation/${id}`);
                fetchReservations();
                if (isAdmin) fetchAccounting();
                toast.success("Rezervasyon başarıyla iptal edildi.");
              } catch (err: any) {
                toast.error(err.response?.data || "İptal başarısız oldu.");
              }
            }} 
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold"
          >
            İptal Et
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const today = new Date().toISOString().split('T')[0];
  const isFutureDate = (dateStr: string) => new Date(dateStr) >= new Date(today);

  // Aylık ciro grafiği verisi (Çizgi/Alan)
  const monthlyRevenue = accounting?.details?.reduce((acc: any, curr: any) => {
    const month = new Date(curr.checkInDate).toLocaleString(i18n.language, { month: 'short' });
    const existingMonth = acc.find((item: any) => item.name === month);
    if (existingMonth) {
      existingMonth.ciro += curr.totalPrice;
    } else {
      acc.push({ name: month, ciro: curr.totalPrice });
    }
    return acc;
  }, []) || [];

  // En popüler odalar grafiği verisi (Pasta)
  const roomPopularity = accounting?.details?.reduce((acc: any, curr: any) => {
    const roomName = `${t('dashboard.roomLabel', 'Oda')} ${curr.room?.roomNumber || curr.roomId}`;
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
      
      {/* Sayfa Başlığı */}
      <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
          {isAdmin ? t('dashboard.welcomeAdmin') : t('dashboard.welcomeCustomer', { name: user?.fullName || '' })}
        </h1>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          {isAdmin ? t('dashboard.subtitleAdmin') : t('dashboard.subtitleCustomer')}
        </p>
      </div>

      {/* Admin Muhasebe Modülü */}
      {isAdmin && accounting && (
        <div className="space-y-8">
          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Kart 1 */}
            <div className="group bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                <DollarSign size={28} className="group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">{t('dashboard.totalRevenue')}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(accounting.totalRevenue)}</h3>
              </div>
            </div>

            {/* Kart 2 */}
            <div className="group bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.3s' }}>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <Activity size={28} className="group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">{t('dashboard.monthlyRevenue')}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(accounting.currentMonthRevenue)}</h3>
              </div>
            </div>

            {/* Kart 3 */}
            <div className="group bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.4s' }}>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <CalendarCheck size={28} className="group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">{t('dashboard.reservations')}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{accounting.totalReservationsCount} {t('dashboard.units')}</h3>
              </div>
            </div>

          </div>

          {/* Grafikler Bölümü */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in" style={{ animationDelay: '0.45s' }}>
            
            {/* Alan (Çizgi) Grafiği: Aylık Ciro */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Activity className="text-blue-500 w-5 h-5" /> {t('dashboard.monthlyRevenueTrend')}
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
                      formatter={(value: any) => [formatPrice(value), t('dashboard.revenue')]}
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
                <BedDouble className="text-emerald-500 w-5 h-5" /> {t('dashboard.roomPreferenceDistribution')}
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
                      formatter={(value: any) => [t('dashboard.timesRented', { count: value }), t('dashboard.preference')]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>

        </div>
      )}

      {/* Müşteriler İçin Oda Listesi */}
      {!isAdmin && (
        <div className="mt-8 animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BedDouble className="text-blue-500 w-5 h-5" /> {t('dashboard.availableRooms')}
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
                    {t('dashboard.roomNo')} {room.roomNumber}
                  </span>
                  <span className="text-blue-600 font-bold text-xl">{formatPrice(room.pricePerNight)} <span className="text-xs text-slate-400 font-normal">{t('dashboard.perNight')}</span></span>
                </div>
                <h3 className="text-slate-700 font-medium mb-1">{t('dashboard.capacity', { count: room.capacity })}</h3>
                
                <button 
                  onClick={() => setSelectedRoom(room)}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-slate-50 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 text-sm"
                >
                  {t('dashboard.bookNow')}
                  <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rezervasyon Tablosu */}
      <div className="pt-6 animate-slide-in" style={{ animationDelay: isAdmin ? '0.6s' : '0.4s' }}>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="text-purple-500 w-5 h-5" /> {isAdmin ? t('dashboard.allReservations') : t('dashboard.myReservations')}
        </h2>
        
        {reservations.length === 0 ? (
          <div className="text-slate-500 text-sm p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
            {t('dashboard.noReservations')}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">{t('dashboard.roomNo')}</th>
                  {isAdmin && <th className="px-6 py-4">{t('dashboard.customer')}</th>}
                  <th className="px-6 py-4">{t('dashboard.checkIn')}</th>
                  <th className="px-6 py-4">{t('dashboard.checkOut')}</th>
                  <th className="px-6 py-4 text-slate-900">{t('dashboard.amount')}</th>
                  <th className="px-6 py-4 text-right">{t('dashboard.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((res) => {
                  const canCancel = isFutureDate(res.checkInDate) || isAdmin; 
                  return (
                    // Tablo Satırı Hover
                    <tr key={res.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-medium">{t('dashboard.roomNo')} {res.room?.roomNumber || res.roomId}</td>
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
                            <span className="text-slate-500 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{t('dashboard.completed')}</span>
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

      {/* Yeni Rezervasyon Modalı */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-md relative shadow-2xl animate-slide-in">
            <button 
              onClick={() => { setSelectedRoom(null); setBookingError(''); setShowConfirmation(false); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all hover:rotate-90"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{t('dashboard.bookNow')}</h2>
            <p className="text-slate-500 text-sm mb-6">{t('reservationForm.room')} {selectedRoom.roomNumber} &bull; <span className="font-semibold text-blue-600">{formatPrice(selectedRoom.pricePerNight)} / {t('reservationForm.nightsFormat')}</span></p>

            {bookingError && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm mb-5 font-medium animate-slide-in">
                {bookingError}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('reservationForm.checkIn')}</label>
                <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all hover:border-slate-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('reservationForm.checkOut')}</label>
                <input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all hover:border-slate-300" />
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mt-4 transition-all">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-blue-800 font-medium">{t('dashboard.duration')}</span>
                  <span className="text-sm font-bold text-blue-700">{totalDays} {t('reservationForm.nightsFormat')}</span>
                </div>
                <div className="flex justify-between items-center border-t border-blue-200/60 pt-3">
                  <span className="text-sm text-blue-800 font-medium">{t('dashboard.totalPrice')}</span>
                  <span className="text-xl font-bold text-blue-700 transition-all">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button 
                onClick={handleInitialSubmit} 
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all mt-2"
              >
                {t('dashboard.continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rezervasyon Onay Modalı */}
      {showConfirmation && selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-slide-in">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">{t('dashboard.confirmTitle')}</h2>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 text-left space-y-3">
              <p className="text-sm text-slate-700"><span className="text-slate-500 w-16 inline-block">{t('reservationForm.room')}:</span> <span className="font-semibold text-slate-900">{t('reservationForm.room')} {selectedRoom.roomNumber}</span></p>
              <p className="text-sm text-slate-700"><span className="text-slate-500 w-16 inline-block">{t('dashboard.date')}:</span> <span className="font-semibold text-slate-900">{new Date(checkIn).toLocaleDateString()} - {new Date(checkOut).toLocaleDateString()}</span></p>
              <p className="text-sm text-slate-700"><span className="text-slate-500 w-16 inline-block">{t('dashboard.durationLabel')}:</span> <span className="font-semibold text-slate-900">{totalDays} {t('reservationForm.nightsFormat')}</span></p>
              <div className="border-t border-slate-200 pt-3 mt-1">
                <p className="text-xl font-black text-emerald-600 text-center">
                  {t('dashboard.totalLabel')}: {formatPrice(totalPrice)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmation(false)} 
                disabled={isBooking}
                className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm disabled:opacity-50"
              >
                {t('reservationForm.cancel')}
              </button>
              <button 
                onClick={handleBookRoom} 
                disabled={isBooking}
                className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50 flex items-center justify-center"
              >
                {isBooking ? t('reservationForm.creating') : t('reservationForm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    {/* Arka Planda Gizli PDF Şablonu */}
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
              <h2 className="text-5xl font-black text-slate-100 uppercase tracking-widest mb-2">{t('dashboard.invoice.title')}</h2>
              <p className="text-slate-500 font-bold">{t('dashboard.invoice.recordNo')} #{invoiceData?.id?.toString().padStart(6, '0')}</p>
              <p className="text-slate-400 text-sm mt-1">{t('dashboard.invoice.date')} {new Date().toLocaleDateString(i18n.language)}</p>
            </div>
          </div>

          <div className="flex justify-between mb-12 bg-slate-50 p-6 rounded-2xl">
            <div>
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">{t('dashboard.invoice.dear')}</h3>
              <p className="text-xl font-bold text-slate-800">{invoiceData?.customer?.firstName || user?.fullName?.split(' ')[0]} {invoiceData?.customer?.lastName || (user?.fullName?.split(' ').slice(1).join(' '))}</p>
              <p className="text-slate-500 font-medium mt-1">{invoiceData?.customer?.email}</p>
              <p className="text-slate-500 font-medium">{invoiceData?.customer?.phoneNumber}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3">{t('dashboard.invoice.provider')}</h3>
              <p className="text-lg font-bold text-slate-800">The Luna Suites Hotel</p>
              <p className="text-slate-500 font-medium mt-1">{t('dashboard.invoice.providerAddress1')}</p>
              <p className="text-slate-500 font-medium">{t('dashboard.invoice.providerAddress2')}</p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 border-b-2 border-slate-100 pb-3">{t('dashboard.invoice.details')}</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-4">{t('dashboard.invoice.serviceRoom')}</th>
                  <th className="pb-4">{t('dashboard.invoice.checkIn')}</th>
                  <th className="pb-4">{t('dashboard.invoice.checkOut')}</th>
                  <th className="pb-4 text-center">{t('dashboard.invoice.nights')}</th>
                  <th className="pb-4 text-right">{t('dashboard.invoice.amount')}</th>
                </tr>
              </thead>
              <tbody className="text-slate-800 font-bold border-b-2 border-slate-100">
                <tr>
                  <td className="py-5">{t('dashboard.invoice.premiumRoom')} {invoiceData?.room?.roomNumber || invoiceData?.roomId} <span className="block text-xs text-slate-400 font-medium mt-1">({t('dashboard.invoice.capacity', { capacity: invoiceData?.room?.capacity || '-' })})</span></td>
                  <td className="py-5">{invoiceData ? new Date(invoiceData.checkInDate).toLocaleDateString(i18n.language) : ''}</td>
                  <td className="py-5">{invoiceData ? new Date(invoiceData.checkOutDate).toLocaleDateString(i18n.language) : ''}</td>
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
                <span>{t('dashboard.invoice.subTotal')}</span>
                <span>{invoiceData ? formatPrice(invoiceData.totalPrice) : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-300">{t('dashboard.invoice.paidAmount')}</span>
                <span className="text-3xl font-black text-amber-400">{invoiceData ? formatPrice(invoiceData.totalPrice) : ''}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-slate-800 font-bold text-lg mb-1">{t('dashboard.invoice.thankYou')}</p>
            <p className="text-slate-400 font-medium text-sm">{t('dashboard.invoice.seeYou')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}