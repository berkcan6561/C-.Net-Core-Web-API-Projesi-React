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
        <div className="rounded-2xl bg-gradient-to-br from-emerald-900/30 via-teal-900/20 to-slate-900 border border-emerald-500/15 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <BedDouble size={20} />
              </div>
              <div>
                <div className="text-white font-bold text-lg">Oda {room.roomNumber}</div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Users size={12} /> {room.capacity} Kişilik
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CalendarDays size={13} /> Giriş
              </span>
              <span className="text-white font-medium">{new Date(checkInDate).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CalendarDays size={13} /> Çıkış
              </span>
              <span className="text-white font-medium">{new Date(checkOutDate).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-1" />
            <div className="flex justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Moon size={13} /> {nights} Gece × {room.pricePerNight.toLocaleString('tr-TR')} ₺
              </span>
              <span className="text-emerald-400 font-black text-lg">{totalPrice.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
        </div>

        {/* Customer select */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
            <User size={14} className="text-slate-500" />
            Müşteri Seçin
          </label>
          <select
            required
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
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
            className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors text-sm font-medium"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || customers.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Oluşturuluyor...' : 'Rezervasyonu Onayla'}
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
        <label className="block text-sm font-medium text-slate-300 mb-1">Müşteri</label>
        <select
          required
          value={customerId}
          onChange={(e) => setCustomerId(Number(e.target.value))}
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Oda</label>
        <select
          required
          value={roomId}
          onChange={(e) => setRoomId(Number(e.target.value))}
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
        >
          {(allRooms || []).map((r) => (
            <option key={r.id} value={r.id}>
              Oda {r.roomNumber} ({r.capacity} Kişilik)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Giriş Tarihi</label>
        <input
          type="date"
          required
          value={editCheckIn}
          onChange={(e) => setEditCheckIn(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Çıkış Tarihi</label>
        <input
          type="date"
          required
          value={editCheckOut}
          onChange={(e) => setEditCheckOut(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
        />
      </div>

      {editNights > 0 && (
        <div className="text-sm text-slate-400 flex items-center gap-2">
          <Moon size={14} className="text-cyan-400" />
          {editNights} gece
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
