import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../api/roomService';
import type { Room } from '../types/room';
import { Modal } from '../components/Modal';
import { RoomForm } from '../components/RoomForm';
import { Plus, Pencil, Trash2, BedDouble, Users } from 'lucide-react';

export function Rooms() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const { data: rooms, isLoading, isError } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
  });

  const createMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      closeModal();
    },
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

  const handleSubmit = (data: Omit<Room, 'id'> | Room) => {
    if ('id' in data) {
      updateMutation.mutate(data as Room);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bu odayı silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      <p className="text-cyan-500 font-medium animate-pulse">Odalar Yükleniyor...</p>
    </div>
  );
  
  if (isError) return (
    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-center font-medium">
      Sunucuya bağlanılamadı. Backend çalışıyor mu?
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8 relative">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2 text-cyan-400 text-sm font-semibold tracking-wider uppercase">
            <BedDouble size={16} /> Oda Yönetimi
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 tracking-tight">
            Odalar
          </h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-2xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={2.5} />
          Yeni Oda
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-sm text-slate-300 border-separate border-spacing-y-2">
            <thead className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Oda No</th>
                <th className="px-6 py-4">Kapasite</th>
                <th className="px-6 py-4">Gecelik Fiyat</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {rooms?.map((room) => (
                <tr key={room.id} className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-2xl group">
                  <td className="px-6 py-4 rounded-l-2xl border border-transparent group-hover:border-white/5 border-r-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 text-white font-bold border border-slate-700 shadow-inner mr-3">
                      {room.roomNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 border border-transparent group-hover:border-white/5 border-x-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
                      <Users size={14} /> {room.capacity} Kişi
                    </span>
                  </td>
                  <td className="px-6 py-4 border border-transparent group-hover:border-white/5 border-x-0">
                    <span className="text-cyan-400 font-bold text-base tracking-wide">
                      {room.pricePerNight.toLocaleString('tr-TR')} ₺
                    </span>
                  </td>
                  <td className="px-6 py-4 rounded-r-2xl border border-transparent group-hover:border-white/5 border-l-0 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(room)}
                        className="p-2 text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded-xl transition-all"
                        title="Düzenle"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all"
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
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500 bg-white/[0.01] rounded-2xl">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <BedDouble size={48} className="opacity-20" />
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
