import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRooms } from '../api/roomService';
import type { Room } from '../types/room';
import type { Customer } from '../types/customer';
import type { Reservation, ReservationRequest } from '../types/reservation';
import { BedDouble, Users, Moon, User, CalendarDays } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useTranslation } from 'react-i18next';

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
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

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
  }, [mode, customers, mode === 'edit' ? props.initialData : undefined]);

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
                <div className="text-slate-900 font-bold text-lg">{t('reservationForm.room')} {room.roomNumber}</div>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                  <Users size={12} /> {room.capacity} {t('reservationForm.capacity')}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm font-medium">
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CalendarDays size={13} /> {t('reservationForm.checkIn')}
              </span>
              <span className="text-slate-900">{new Date(checkInDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CalendarDays size={13} /> {t('reservationForm.checkOut')}
              </span>
              <span className="text-slate-900">{new Date(checkOutDate).toLocaleDateString()}</span>
            </div>
            <div className="h-px bg-slate-200 my-2" />
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-200">
              <span className="text-slate-600 font-semibold flex items-center gap-2 text-sm">
                <Moon size={13} className="text-amber-500" /> {nights} {t('reservationForm.nightsFormat')} × {formatPrice(room.pricePerNight)}
              </span>
              <span className="text-blue-600 font-black text-lg">{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Customer select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <User size={14} className="text-slate-500" />
            {t('reservationForm.selectCustomer')}
          </label>
          <select
            required
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 text-sm font-medium"
          >
            {customers.length === 0 && (
              <option value={0}>{t('reservationForm.customerNotFound')}</option>
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
            {t('reservationForm.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || customers.length === 0}
            className="flex-1 bg-slate-900 text-amber-500 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('reservationForm.creating') : t('reservationForm.confirm')}
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
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('reservationForm.customer')}</label>
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
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('reservationForm.room')}</label>
        <select
          required
          value={roomId}
          onChange={(e) => setRoomId(Number(e.target.value))}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 text-sm font-medium"
        >
          {(allRooms || []).map((r) => (
            <option key={r.id} value={r.id}>
              {t('reservationForm.room')} {r.roomNumber} ({r.capacity} {t('reservationForm.capacity')})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('reservationForm.checkIn')}</label>
        <input
          type="date"
          required
          value={editCheckIn}
          onChange={(e) => setEditCheckIn(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 text-sm font-medium"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('reservationForm.checkOut')}</label>
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
          {editNights} {t('reservationForm.nightsFormat')}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 px-4 rounded-xl hover:bg-slate-200 transition-all text-sm"
        >
          {t('reservationForm.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || editNights <= 0}
          className="flex-1 bg-slate-900 text-amber-500 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('reservationForm.updating') : t('reservationForm.update')}
        </button>
      </div>
    </form>
  );
}
