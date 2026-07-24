import { useState, useEffect } from 'react';
import type { Room } from '../types/room';
import { X } from 'lucide-react';
import { deleteRoomImage } from '../api/roomService';

interface RoomFormProps {
  initialData?: Room;
  onSubmit: (data: Omit<Room, 'id'> | Room, files?: FileList | null) => void;
  onCancel: () => void;
}

export function RoomForm({ initialData, onSubmit, onCancel }: RoomFormProps) {
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [pricePerNight, setPricePerNight] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (initialData) {
      setRoomNumber(initialData.roomNumber);
      setCapacity(initialData.capacity);
      setPricePerNight(initialData.pricePerNight);
      setImageUrls(initialData.imageUrls || []);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      onSubmit({ id: initialData.id, roomNumber, capacity, pricePerNight, imageUrls }, selectedFiles);
    } else {
      onSubmit({ roomNumber, capacity, pricePerNight }, selectedFiles);
    }
  };

  const handleDeleteImage = async (url: string) => {
    if (!initialData) return;
    if (window.confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
      try {
        await deleteRoomImage(initialData.id, url);
        setImageUrls(prev => prev.filter(img => img !== url));
      } catch (error) {
        console.error("Resim silinirken hata oluştu", error);
        alert("Resim silinirken bir hata oluştu.");
      }
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

      {initialData && imageUrls.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Mevcut Fotoğraflar</label>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative group">
                <img src={`http://localhost:5184${url}`} alt="Oda" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(url)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Yeni Fotoğraflar Ekle</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setSelectedFiles(e.target.files)}
          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
