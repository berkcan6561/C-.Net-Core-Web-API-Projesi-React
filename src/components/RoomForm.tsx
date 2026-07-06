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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Oda Numarası</label>
        <input
          type="text"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          required
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors duration-200 placeholder-slate-500"
          placeholder="Ör: 101"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Kapasite</label>
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          required
          min={1}
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors duration-200 placeholder-slate-500"
          placeholder="Ör: 2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Gecelik Fiyat (TL)</label>
        <input
          type="number"
          value={pricePerNight}
          onChange={(e) => setPricePerNight(Number(e.target.value))}
          required
          min={0}
          step={0.01}
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors duration-200 placeholder-slate-500"
          placeholder="Ör: 500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-cyan-500/20"
        >
          Kaydet
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-700 text-slate-300 font-medium py-2.5 px-4 rounded-lg hover:bg-slate-600 transition-all duration-200"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
