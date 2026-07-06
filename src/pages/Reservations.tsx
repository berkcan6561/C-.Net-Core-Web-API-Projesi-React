import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReservations, createReservation, updateReservation, deleteReservation } from '../api/reservationService';
import { getAvailableRooms } from '../api/roomService';
import { getCustomers } from '../api/customerService';
import type { Room } from '../types/room';
import type { Reservation, ReservationRequest } from '../types/reservation';
import { Modal } from '../components/Modal';
import { ReservationForm } from '../components/ReservationForm';
import { Pencil, Trash2, CalendarCheck, BedDouble, User, Search, Moon, Users, Sparkles, CalendarDays } from 'lucide-react';

export function Reservations() {
  const queryClient = useQueryClient();

  // Date selection state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Room booking modal state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Edit reservation modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // Calculate nights
  const nights = checkIn && checkOut
    ? Math.max(0, Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Queries
  const { data: reservations, isLoading: isReservationsLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: getReservations,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const { data: availableRooms, isLoading: isSearching, isError: isSearchError } = useQuery({
    queryKey: ['availableRooms', checkIn, checkOut],
    queryFn: () => getAvailableRooms(checkIn, checkOut),
    enabled: searchTriggered && !!checkIn && !!checkOut && nights > 0,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['availableRooms'] });
      closeBookingModal();
    },
    onError: (error: any) => {
      const msg = error?.response?.data || error?.message || 'Bilinmeyen hata';
      alert('Rezervasyon oluşturulurken hata: ' + msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ReservationRequest }) => updateReservation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['availableRooms'] });
      closeEditModal();
    },
    onError: (error: any) => {
      const msg = error?.response?.data || error?.message || 'Bilinmeyen hata';
      alert('Rezervasyon güncellenirken hata: ' + msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['availableRooms'] });
    },
  });

  // Handlers
  const handleSearch = () => {
    if (!checkIn || !checkOut) return;
    if (nights <= 0) {
      alert('Çıkış tarihi, giriş tarihinden sonra olmalıdır.');
      return;
    }
    setSearchTriggered(true);
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedRoom(null);
  };

  const handleBookingSubmit = (data: ReservationRequest) => {
    createMutation.mutate(data);
  };

  const handleEditOpen = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingReservation(null);
  };

  const handleEditSubmit = (data: ReservationRequest) => {
    if (editingReservation) {
      updateMutation.mutate({ id: editingReservation.id, data });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bu rezervasyonu silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  // Today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="animate-fade-in space-y-10 relative">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-emerald-400 text-sm font-semibold tracking-wider uppercase">
          <CalendarCheck size={16} /> Rezervasyon Yönetimi
        </div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-400 tracking-tight">
          Rezervasyonlar
        </h1>
        <p className="text-slate-400 mt-2 text-sm">Tarih seçin, müsait odaları görüntüleyin ve anında rezervasyon oluşturun.</p>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* DATE SEARCH PANEL */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="relative rounded-3xl overflow-hidden">
        {/* Glow border effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 p-px">
          <div className="w-full h-full rounded-3xl bg-[#0d1424]" />
        </div>

        <div className="relative p-8">
          {/* Top glow line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Search size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Müsait Oda Ara</h2>
              <p className="text-xs text-slate-500">Giriş ve çıkış tarihi seçerek uygun odaları listeleyin</p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-slate-400 mb-2 tracking-wider uppercase">
                <CalendarDays size={12} className="inline mr-1.5" />
                Giriş Tarihi
              </label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  setSearchTriggered(false);
                }}
                className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-slate-400 mb-2 tracking-wider uppercase">
                <CalendarDays size={12} className="inline mr-1.5" />
                Çıkış Tarihi
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => {
                  setCheckOut(e.target.value);
                  setSearchTriggered(false);
                }}
                className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
              />
            </div>

            {/* Nights badge */}
            {nights > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold self-end">
                <Moon size={16} />
                {nights} Gece
              </div>
            )}

            <button
              onClick={handleSearch}
              disabled={!checkIn || !checkOut || nights <= 0}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-2 text-sm"
            >
              <Search size={18} />
              Odaları Ara
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* AVAILABLE ROOMS GRID */}
      {/* ═══════════════════════════════════════════════════ */}
      {searchTriggered && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <h2 className="text-xl font-bold text-white">
              Müsait Odalar
            </h2>
            {availableRooms && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                {availableRooms.length} oda bulundu
              </span>
            )}
          </div>

          {isSearching && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-emerald-500 font-medium animate-pulse text-sm">Müsait odalar aranıyor...</p>
            </div>
          )}

          {isSearchError && (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-center font-medium text-sm">
              Odalar aranırken bir hata oluştu. Backend çalışıyor mu?
            </div>
          )}

          {availableRooms && availableRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white/[0.02] border border-white/5 rounded-3xl">
              <BedDouble size={56} className="text-slate-600" />
              <div className="text-center">
                <p className="text-slate-400 font-semibold">Bu tarihler için müsait oda bulunamadı</p>
                <p className="text-slate-600 text-sm mt-1">Farklı tarihler deneyebilirsiniz</p>
              </div>
            </div>
          )}

          {availableRooms && availableRooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRooms.map((room, index) => (
                <div
                  key={room.id}
                  className="group relative bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(16,185,129,0.1)]"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Card top glow */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/0 group-hover:via-emerald-500/40 to-transparent transition-all duration-500" />

                  {/* Room number badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-white font-bold text-sm flex items-center gap-1.5">
                      <BedDouble size={14} className="text-emerald-400" />
                      {room.roomNumber}
                    </div>
                  </div>

                  {/* Card gradient header */}
                  <div className="h-28 bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.15),transparent_60%)]" />
                    <div className="absolute bottom-4 left-6">
                      <div className="text-2xl font-black text-white tracking-tight">
                        Oda {room.roomNumber}
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-6 space-y-5">
                    {/* Room info */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/15 text-indigo-300 text-xs font-semibold">
                        <Users size={14} />
                        {room.capacity} Kişilik
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Gecelik Fiyat</span>
                        <span className="text-slate-300 font-semibold">{room.pricePerNight.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm font-medium">{nights} Gece Toplam</span>
                        <span className="text-emerald-400 font-black text-xl tracking-tight">
                          {(room.pricePerNight * nights).toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                    </div>

                    {/* Book button */}
                    <button
                      onClick={() => handleSelectRoom(room)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                    >
                      <Sparkles size={16} />
                      Rezerve Et
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* EXISTING RESERVATIONS TABLE */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <h2 className="text-xl font-bold text-white">Mevcut Rezervasyonlar</h2>
          {reservations && (
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
              {reservations.length} kayıt
            </span>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="overflow-x-auto p-4">
            {isReservationsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <p className="text-cyan-500 font-medium animate-pulse text-sm">Rezervasyonlar yükleniyor...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300 border-separate border-spacing-y-2">
                <thead className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Müşteri</th>
                    <th className="px-6 py-4">Oda</th>
                    <th className="px-6 py-4">Tarihler</th>
                    <th className="px-6 py-4">Tutar</th>
                    <th className="px-6 py-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations?.map((reservation) => (
                    <tr key={reservation.id} className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-2xl group">
                      <td className="px-6 py-4 rounded-l-2xl border border-transparent group-hover:border-white/5 border-r-0">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="font-bold text-white text-base tracking-wide">
                              {reservation.customer?.firstName} {reservation.customer?.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border border-transparent group-hover:border-white/5 border-x-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                          <BedDouble size={14} /> Oda {reservation.room?.roomNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 border border-transparent group-hover:border-white/5 border-x-0">
                        <div className="flex flex-col gap-1 text-xs font-medium">
                          <div className="text-emerald-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]" />
                            Giriş: {new Date(reservation.checkInDate).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-rose-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,1)]" />
                            Çıkış: {new Date(reservation.checkOutDate).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border border-transparent group-hover:border-white/5 border-x-0">
                        <span className="text-emerald-400 font-bold text-base tracking-wide">
                          {reservation.totalPrice.toLocaleString('tr-TR')} ₺
                        </span>
                      </td>
                      <td className="px-6 py-4 rounded-r-2xl border border-transparent group-hover:border-white/5 border-l-0 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditOpen(reservation)}
                            className="p-2 text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-xl transition-all"
                            title="Düzenle"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(reservation.id)}
                            className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all"
                            title="Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reservations?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-500 bg-white/[0.01] rounded-2xl">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <CalendarCheck size={48} className="opacity-20" />
                          <p>Henüz rezervasyon bulunmuyor.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* BOOKING MODAL (New Reservation from Room Card) */}
      {/* ═══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={closeBookingModal}
        title="Rezervasyon Oluştur"
      >
        {selectedRoom && (
          <ReservationForm
            mode="book"
            room={selectedRoom}
            checkInDate={checkIn}
            checkOutDate={checkOut}
            nights={nights}
            customers={customers || []}
            onSubmit={handleBookingSubmit}
            onCancel={closeBookingModal}
            isSubmitting={createMutation.isPending}
          />
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════ */}
      {/* EDIT MODAL (Existing Reservation) */}
      {/* ═══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Rezervasyonu Düzenle"
      >
        {editingReservation && (
          <ReservationForm
            mode="edit"
            initialData={editingReservation}
            customers={customers || []}
            onSubmit={handleEditSubmit}
            onCancel={closeEditModal}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
