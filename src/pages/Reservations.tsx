import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReservations, createReservation, updateReservation, deleteReservation } from '../api/reservationService';
import { getAvailableRooms } from '../api/roomService';
import { getCustomers } from '../api/customerService';
import type { Room } from '../types/room';
import type { Reservation, ReservationRequest } from '../types/reservation';
import { Modal } from '../components/Modal';
import { ReservationForm } from '../components/ReservationForm';
import { RoomCarousel } from '../components/RoomCarousel';
import { Pencil, Trash2, CalendarCheck, BedDouble, User, Search, Moon, Users, Sparkles, CalendarDays } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useTranslation } from 'react-i18next';

export function Reservations() {
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  // Tarih seçimi state'leri
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Oda rezervasyon modal state'leri
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Rezervasyon düzenleme modal state'leri
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // Kalınacak gece sayısını hesapla
  const nights = checkIn && checkOut
    ? Math.max(0, Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // API İstekleri (Queries)
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

  // Veri Güncelleme İşlemleri (Mutations)
  const createMutation = useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['availableRooms'] });
      closeBookingModal();
    },
    onError: (error: any) => {
      const msg = error?.response?.data || error?.message || 'Bilinmeyen hata';
      toast.error('Rezervasyon oluşturulurken hata: ' + msg);
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
      toast.error('Rezervasyon güncellenirken hata: ' + msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['availableRooms'] });
    },
  });


  // Olay İşleyicileri (Handlers)
  const handleSearch = () => {
    if (!checkIn || !checkOut) return;
    if (nights <= 0) {
      toast.error('Çıkış tarihi, giriş tarihinden sonra olmalıdır.');
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
    toast((tToast) => (
      <div>
        <p className="mb-3 font-semibold">Bu rezervasyonu silmek istediğinize emin misiniz?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(tToast.id)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-bold">İptal</button>
          <button 
            onClick={() => {
              deleteMutation.mutate(id);
              toast.dismiss(tToast.id);
            }} 
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold"
          >
            Sil
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  // Geçmiş tarihlerin seçilmesini engellemek için bugünün tarihi
  const today = new Date().toISOString().split('T')[0];

     return (
    <div className="animate-fade-in space-y-10 relative">
      {/* Sayfa Başlığı */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-bold tracking-wider uppercase">
          <CalendarCheck size={16} className="text-blue-600" /> {t('pages.reservations.pageTitle')}
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('pages.reservations.pageHeader')}
        </h1>
        <p className="text-slate-500 mt-2 text-sm">{t('pages.reservations.pageSubtitle')}</p>
      </div>

      {/* Tarih Arama Paneli */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="relative p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Search size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('pages.reservations.searchTitle')}</h2>
              <p className="text-xs text-slate-500">{t('pages.reservations.searchSubtitle')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-slate-700 mb-2 tracking-wider uppercase">
                <CalendarDays size={12} className="inline mr-1.5" />
                {t('pages.reservations.checkInDate')}
              </label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  setSearchTriggered(false);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all text-sm"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-slate-700 mb-2 tracking-wider uppercase">
                <CalendarDays size={12} className="inline mr-1.5" />
                {t('pages.reservations.checkOutDate')}
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => {
                  setCheckOut(e.target.value);
                  setSearchTriggered(false);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all text-sm"
              />
            </div>

            {/* Gece sayısı rozeti */}
            {nights > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold self-end">
                <Moon size={16} className="text-amber-500" />{t('pages.reservations.nights', { count: nights })}</div>
            )}

            <button
              onClick={handleSearch}
              disabled={!checkIn || !checkOut || nights <= 0}
              className="px-8 py-3 bg-slate-900 text-amber-500 font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-2 text-sm"
            >
              <Search size={18} />
              {t('pages.reservations.searchRoomsButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Uygun Odalar Grid Listesi */}
      {searchTriggered && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
            <h2 className="text-xl font-bold text-slate-900">
              {t('pages.reservations.availableRoomsTitle')}
            </h2>
            {availableRooms && (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-200">
                {t('pages.reservations.roomsFound', { count: availableRooms.length })}
              </span>
            )}
          </div>

          {isSearching && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
              <p className="text-slate-600 font-medium animate-pulse text-sm">{t('pages.reservations.searching')}</p>
            </div>
          )}

          {isSearchError && (
            <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-center font-medium text-sm">
              {t('pages.reservations.searchError')}
            </div>
          )}

          {availableRooms && availableRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <BedDouble size={56} className="text-slate-300" />
              <div className="text-center">
                <p className="text-slate-600 font-bold">{t('pages.reservations.noRoomsFoundTitle')}</p>
                <p className="text-slate-500 text-sm mt-1">{t('pages.reservations.noRoomsFoundDesc')}</p>
              </div>
            </div>
          )}

          {availableRooms && availableRooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRooms.map((room, index) => (
                <div
                  key={room.id}
                  className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <RoomCarousel imageUrls={room.imageUrls} />
                  
                  {/* Oda numarası rozeti */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-800 font-bold text-sm flex items-center gap-1.5 shadow-sm">
                      <BedDouble size={14} className="text-blue-600" />
                      {room.roomNumber}
                    </div>
                  </div>

                  {/* Card gradient header */}
                  <div className="h-28 bg-slate-50 border-b border-slate-100 relative overflow-hidden flex items-end p-6">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">{t('pages.reservations.roomNo', { number: room.roomNumber })}</div>
                  </div>

                  {/* Card body */}
                  <div className="p-6 space-y-5">
                    {/* Oda özellikleri */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                        <Users size={14} />
                        {t('pages.reservations.capacity', { count: room.capacity })}
                      </div>
                    </div>

                    {/* Fiyatlandırma */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{t('pages.reservations.pricePerNight')}</span>
                        <span className="text-slate-900 font-bold">{formatPrice(room.pricePerNight)}</span>
                      </div>
                      <div className="h-px bg-slate-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm font-semibold">{t('pages.reservations.totalPrice', { count: nights })}</span>
                        <span className="text-blue-600 font-black text-xl tracking-tight">
                          {formatPrice(room.pricePerNight * nights)}
                        </span>
                      </div>
                    </div>

                    {/* Rezervasyon butonu */}
                    <button
                      onClick={() => handleSelectRoom(room)}
                      className="w-full py-3 bg-slate-900 text-amber-500 font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                    >
                      <Sparkles size={16} />
                      {t('pages.reservations.bookRoom')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mevcut Rezervasyonlar Tablosu */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
          <h2 className="text-xl font-bold text-slate-900">{t('pages.reservations.existingReservationsTitle')}</h2>
          {reservations && (
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
              {t('pages.reservations.recordsFound', { count: reservations.length })}
            </span>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="overflow-x-auto">
            {isReservationsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                <p className="text-slate-600 font-semibold animate-pulse text-sm">{t('pages.reservations.loadingReservations')}</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">{t('pages.reservations.tableCustomer')}</th>
                    <th className="px-6 py-4">{t('pages.reservations.tableRoom')}</th>
                    <th className="px-6 py-4">{t('pages.reservations.tableDates')}</th>
                    <th className="px-6 py-4">{t('pages.reservations.tableAmount')}</th>
                    <th className="px-6 py-4 text-right">{t('pages.reservations.tableActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations?.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-slate-50 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-500 border border-slate-200">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-base tracking-wide">
                              {reservation.customer?.firstName} {reservation.customer?.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                          <BedDouble size={14} /> {t('pages.reservations.roomNo', { number: reservation.room?.roomNumber })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs font-bold">
                          <div className="text-slate-700 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            {t('pages.reservations.tableCheckIn')} {new Date(reservation.checkInDate).toLocaleDateString()}
                          </div>
                          <div className="text-slate-700 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            {t('pages.reservations.tableCheckOut')} {new Date(reservation.checkOutDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-base">
                        {formatPrice(reservation.totalPrice)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditOpen(reservation)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            title={t('pages.reservations.edit')}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(reservation.id)}
                            className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            title={t('pages.reservations.delete')}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reservations?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-500 bg-white">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <CalendarCheck size={48} className="opacity-20 text-slate-400" />
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

      {/* Yeni Rezervasyon Modalı (Oda Kartından) */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={closeBookingModal}
        title={t('pages.reservations.createReservationTitle')}
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

      {/* Rezervasyon Düzenleme Modalı */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={t('pages.reservations.editReservationTitle')}
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