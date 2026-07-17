import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRooms } from '../api/roomService';
import type { Room } from '../types/room';
import type { Customer } from '../types/customer';
import type { Reservation, ReservationRequest } from '../types/reservation';
import { BedDouble, Users, Moon, User, CalendarDays } from 'lucide-react';

interface BookModeProps {
  mode: 'book';
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  customers: Customer[];
  onSubmit: (data: ReservationRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: never;
}

interface EditModeProps {
  mode: 'edit';
  initialData: Reservation;
  customers: Customer[];
  onSubmit: (data: ReservationRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  room?: never;
  checkInDate?: never;
  checkOutDate?: never;
  nights?: never;
}

type ReservationFormProps = BookModeProps | EditModeProps;

export function ReservationForm(props: ReservationFormProps) {
  const { mode, customers, onSubmit, onCancel, isSubmitting } = props;

  // Edit mode: need rooms list for dropdown
  const { data: allRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
    enabled: mode === 'edit',
  });

  // State for edit mode
  const [customerId, setCustomerId] = useState<number>(0);
  const [roomId, setRoomId] = useState<number>(0);
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');

  // Initialize values
  useEffect(() => {
    if (mode === 'book') {
      if (customers.length > 0 && customerId === 0) {
        setCustomerId(customers[0].id);
      }
    } else if (mode === 'edit' && props.initialData) {
      setCustomerId(props.initialData.customerId);
      setRoomId(props.initialData.roomId);
      setEditCheckIn(props.initialData.checkInDate.substring(0, 10));
      setEditCheckOut(props.initialData.checkOutDate.substring(0, 10));
    }
  }, [mode, customers, props]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'book') {
      onSubmit({
        customerId,
        roomId: props.room.id,
        checkInDate: new Date(props.checkInDate).toISOString(),
        checkOutDate: new Date(props.checkOutDate).toISOString(),
      });
    } else {
      onSubmit({
        customerId,
        roomId,
        checkInDate: new Date(editCheckIn).toISOString(),
        checkOutDate: new Date(editCheckOut).toISOString(),
      });
    }
  };

  // ═══ BOOK MODE ═══
  if (mode === 'book') {
    const { room, checkInDate, checkOutDate, nights } = props;
    const totalPrice = room.pricePerNight * nights;

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room summary card */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <BedDouble size={20} />
              </div>
              <div>
                <div className="text-slate-900 font-bold text-lg">Oda {room.roomNumber}</div>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                  <Users size={12} /> {room.capacity} Kişilik
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm font-medium">
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CalendarDays size={13} /> Giriş
              </span>
              <span className="text-slate-900">{new Date(checkInDate).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CalendarDays size={13} /> Çıkış
              </span>
              <span className="text-slate-900">{new Date(checkOutDate).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="h-px bg-slate-200 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Moon size={13} className="text-amber-500" /> {nights} Gece × {room.pricePerNight.toLocaleString('tr-TR')} ₺
              </span>
              <span className="text-blue-600 font-black text-lg">{totalPrice.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
        </div>

        {/* Customer select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <User size={14} className="text-slate-500" />
            Müşteri Seçin
          </label>
          <select
            required
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 text-sm font-medium"
          >
            {customers.length === 0 && (
              <option value={0}>Müşteri bulunamadı</option>
            )}
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 px-4 rounded-xl hover:bg-slate-200 transition-all text-sm"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || customers.length === 0}
            className="flex-1 bg-slate-900 text-amber-500 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Oluşturuluyor...' : 'Onayla'}
          </button>
        </div>
      </form>
    );
  }

  // ═══ EDIT MODE ═══
  const editNights = editCheckIn && editCheckOut
    ? Math.max(0, Math.floor((new Date(editCheckOut).getTime() - new Date(editCheckIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Müşteri</label>
        <select
          required
          value={customerId}
          onChange={(e) => setCustomerId(Number(e.target.value))}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 text-sm font-medium"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Oda</label>
        <select
          required
          value={roomId}
          onChange={(e) => setRoomId(Number(e.target.value))}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 text-sm font-medium"
        >
          {(allRooms || []).map((r) => (
            <option key={r.id} value={r.id}>
              Oda {r.roomNumber} ({r.capacity} Kişilik)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Giriş Tarihi</label>
        <input
          type="date"
          required
          value={editCheckIn}
          onChange={(e) => setEditCheckIn(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 text-sm font-medium"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Çıkış Tarihi</label>
        <input
          type="date"
          required
          value={editCheckOut}
          onChange={(e) => setEditCheckOut(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 text-sm font-medium"
        />
      </div>

      {editNights > 0 && (
        <div className="text-sm text-slate-500 font-bold flex items-center gap-2">
          <Moon size={14} className="text-amber-500" />
          {editNights} gece
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 px-4 rounded-xl hover:bg-slate-200 transition-all text-sm"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-slate-900 text-amber-500 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all shadow-md text-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
