import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../api/roomService';
import type { Room } from '../types/room';
import { Modal } from '../components/Modal';
import { RoomForm } from '../components/RoomForm';
import { Plus, Pencil, Trash2, BedDouble, Users } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export function Rooms() {
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const { data: rooms, isLoading, isError } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
  });

  const createMutation = useMutation({
    mutationFn: createRoom,
  });

  const updateMutation = useMutation({
    mutationFn: updateRoom,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const handleOpenModal = (room?: Room) => {
    setEditingRoom(room || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleSubmit = async (data: Omit<Room, 'id'> | Room, files?: FileList | null) => {
    try {
      let roomId: number;
      
      if ('id' in data) {
        await updateMutation.mutateAsync(data as Room);
        roomId = data.id;
      } else {
        const newRoom = await createMutation.mutateAsync(data);
        roomId = newRoom.id;
      }

      // If files are selected, upload them
      if (files && files.length > 0) {
        const { uploadRoomImages } = await import('../api/roomService');
        await uploadRoomImages(roomId, files);
      }

      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      closeModal();
    } catch (error) {
      console.error("Oda kaydedilirken hata:", error);
      alert("Oda kaydedilirken bir hata oluştu.");
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bu odayı silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

   if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      <p className="text-slate-600 font-semibold animate-pulse">Odalar Yükleniyor...</p>
    </div>
  );
  
  if (isError) return (
    <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-center font-medium shadow-sm">
      Sunucuya bağlanılamadı. Backend çalışıyor mu?
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8 relative">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-bold tracking-wider uppercase">
            <BedDouble size={16} className="text-blue-600" /> Oda Yönetimi
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Odalar
          </h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-slate-900 text-amber-500 font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={2.5} />
          Yeni Oda
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Oda No</th>
                <th className="px-6 py-4">Kapasite</th>
                <th className="px-6 py-4">Gecelik Fiyat</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms?.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50 transition-colors group cursor-default">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-sm mr-3 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                      {room.roomNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Users size={14} /> {room.capacity} Kişi
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {formatPrice(room.pricePerNight)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(room)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        title="Düzenle"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rooms?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500 bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <BedDouble size={48} className="opacity-20 text-slate-400" />
                      <p>Henüz hiç oda eklenmemiş.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRoom ? "Odayı Düzenle" : "Yeni Oda Ekle"}
      >
        <RoomForm
          initialData={editingRoom || undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}