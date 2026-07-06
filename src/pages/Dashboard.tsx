import { useQuery } from '@tanstack/react-query';
import { getRooms } from '../api/roomService';
import { getCustomers } from '../api/customerService';
import { getReservations } from '../api/reservationService';
import { Link } from '@tanstack/react-router';
import { BedDouble, Users, CalendarCheck, ArrowRight, Activity } from 'lucide-react';

export function Dashboard() {
  const { data: rooms } = useQuery({ queryKey: ['rooms'], queryFn: getRooms });
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: getCustomers });
  const { data: reservations } = useQuery({ queryKey: ['reservations'], queryFn: getReservations });

  const activeReservations = reservations?.length || 0;
  const recentReservations = reservations?.slice(-5).reverse() || [];

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2 text-cyan-400 text-sm font-semibold tracking-wider uppercase">
            <Activity size={16} /> Sisteme Genel Bakış
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 tracking-tight">
            Otel Yönetim Paneli
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Bugünün istatistikleri ve son işlemler.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 font-medium">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-cyan-900/30 to-[#0a0f1c] border border-cyan-800/30 rounded-3xl p-8 transition-all hover:scale-[1.02] duration-300 relative overflow-hidden group shadow-xl">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-400/30 transition-colors" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h3 className="text-cyan-200/70 text-sm font-semibold tracking-wider uppercase">Toplam Oda</h3>
              <p className="text-5xl font-black text-white mt-4 tracking-tighter">{rooms?.length || 0}</p>
            </div>
            <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <BedDouble size={28} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-violet-900/30 to-[#0a0f1c] border border-violet-800/30 rounded-3xl p-8 transition-all hover:scale-[1.02] duration-300 relative overflow-hidden group shadow-xl">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl group-hover:bg-violet-400/30 transition-colors" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h3 className="text-violet-200/70 text-sm font-semibold tracking-wider uppercase">Toplam Müşteri</h3>
              <p className="text-5xl font-black text-white mt-4 tracking-tighter">{customers?.length || 0}</p>
            </div>
            <div className="p-4 bg-violet-500/10 rounded-2xl text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Users size={28} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/30 to-[#0a0f1c] border border-emerald-800/30 rounded-3xl p-8 transition-all hover:scale-[1.02] duration-300 relative overflow-hidden group shadow-xl">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-400/30 transition-colors" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h3 className="text-emerald-200/70 text-sm font-semibold tracking-wider uppercase">Aktif Rezervasyon</h3>
              <p className="text-5xl font-black text-white mt-4 tracking-tighter">{activeReservations}</p>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CalendarCheck size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reservations Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="w-2 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            Son Rezervasyonlar
          </h2>
          <Link to="/reservations" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group">
            Tümünü Gör <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-sm text-slate-300 border-separate border-spacing-y-2">
            <thead className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">Oda</th>
                <th className="px-6 py-4">Giriş Tarihi</th>
                <th className="px-6 py-4">Çıkış Tarihi</th>
                <th className="px-6 py-4">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {recentReservations.map((res) => (
                <tr key={res.id} className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-2xl group">
                  <td className="px-6 py-4 rounded-l-2xl border border-transparent group-hover:border-white/5 border-r-0">
                    <div className="font-semibold text-white">{res.customer?.firstName} {res.customer?.lastName}</div>
                    <div className="text-xs text-slate-500">{res.customer?.email}</div>
                  </td>
                  <td className="px-6 py-4 border border-transparent group-hover:border-white/5 border-x-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                      Oda {res.room?.roomNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 border border-transparent group-hover:border-white/5 border-x-0 font-medium">
                    {new Date(res.checkInDate).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 border border-transparent group-hover:border-white/5 border-x-0 font-medium">
                    {new Date(res.checkOutDate).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 rounded-r-2xl border border-transparent group-hover:border-white/5 border-l-0">
                    <span className="text-cyan-400 font-bold">
                      {res.totalPrice.toLocaleString('tr-TR')} ₺
                    </span>
                  </td>
                </tr>
              ))}
              {recentReservations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 bg-white/[0.01] rounded-2xl">
                    Henüz rezervasyon bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
