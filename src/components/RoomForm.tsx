import { useState, useEffect } from 'react';
import type { Room } from '../types/room';

interface RoomFormProps {
  initialData?: Room;
  onSubmit: (data: Omit<Room, 'id'> | Room) => void;
  onCancel: () => void;
}

export function RoomForm({ initialData, onSubmit, onCancel }: RoomFormProps) {
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [pricePerNight, setPricePerNight] = useState(0);

  useEffect(() => {
    if (initialData) {
      setRoomNumber(initialData.roomNumber);
      setCapacity(initialData.capacity);
      setPricePerNight(initialData.pricePerNight);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      onSubmit({ id: initialData.id, roomNumber, capacity, pricePerNight });
    } else {
      onSubmit({ roomNumber, capacity, pricePerNight });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Oda Numarası</label>
        <input
          type="text"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          required
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 placeholder-slate-400 text-sm"
          placeholder="Ör: 101"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Kapasite</label>
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          required
          min={1}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 placeholder-slate-400 text-sm"
          placeholder="Ör: 2"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Gecelik Fiyat (TL)</label>
        <input
          type="number"
          value={pricePerNight}
          onChange={(e) => setPricePerNight(Number(e.target.value))}
          required
          min={0}
          step={0.01}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 placeholder-slate-400 text-sm"
          placeholder="Ör: 500"
        />
      </div>

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
          className="flex-1 bg-slate-900 text-amber-500 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all shadow-md text-sm"
        >
          Kaydet
        </button>
      </div>
    </form>
  );
}
