import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import type { Room } from '../types/room';
import { X } from 'lucide-react';
import { deleteRoomImage } from '../api/roomService';
import toast from 'react-hot-toast';

interface RoomFormProps {
  initialData?: Room;
  onSubmit: (data: Omit<Room, 'id'> | Room, files?: FileList | null) => void;
  onCancel: () => void;
}

export function RoomForm({ initialData, onSubmit, onCancel }: RoomFormProps) {
  const { t } = useTranslation();
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
    
    toast((tToast) => (
      <div>
        <p className="mb-3 font-semibold">Bu fotoğrafı silmek istediğinize emin misiniz?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(tToast.id)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-bold">İptal</button>
          <button 
            onClick={async () => {
              toast.dismiss(tToast.id);
              try {
                await deleteRoomImage(initialData.id, url);
                setImageUrls(prev => prev.filter(img => img !== url));
                toast.success('Resim silindi');
              } catch (error) {
                toast.error('Resim silinirken bir hata oluştu.');
              }
            }} 
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold"
          >
            Sil
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.rooms.roomNo')}</label>
        <input
          type="text"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          required
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 placeholder-slate-400 text-sm"
          placeholder={t('pages.rooms.roomNoPlaceholder')}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.rooms.capacitySimple')}</label>
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
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.rooms.price')}</label>
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
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.rooms.existingImages')}</label>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url) => (
              <div key={url} className="relative group">
                <img src={`${import.meta.env.VITE_API_BASE}${url}`} alt="Oda" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
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
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.rooms.addNewImages')}</label>
                <div className="relative flex items-center gap-3">
          <input
            type="file"
            multiple
            accept="image/*"
            id="roomImages"
            onChange={(e) => setSelectedFiles(e.target.files)}
            className="hidden"
          />
          <label
            htmlFor="roomImages"
            className="cursor-pointer py-2 px-4 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            {t('pages.rooms.chooseFiles')}
          </label>
          <span className="text-sm text-slate-500 truncate">
            {selectedFiles && selectedFiles.length > 0
              ? t('pages.rooms.filesSelected', { count: selectedFiles.length })
              : t('pages.rooms.noFileChosen')}
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 px-4 rounded-xl hover:bg-slate-200 transition-all text-sm"
        >{t('pages.rooms.cancel')}</button>
        <button
          type="submit"
          className="flex-1 bg-slate-900 text-amber-500 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all shadow-md text-sm"
        >{t('pages.rooms.save')}</button>
      </div>
    </form>
  );
}
