import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/customerService';
import type { Customer } from '../types/customer';
import { Modal } from '../components/Modal';
import { CustomerForm } from '../components/CustomerForm';
import { Plus, Pencil, Trash2, Users, Mail, Phone } from 'lucide-react';

export function Customers() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading, isError } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const handleOpenModal = (customer?: Customer) => {
    setEditingCustomer(customer || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmit = (data: Omit<Customer, 'id'> | Customer) => {
    if ('id' in data) {
      updateMutation.mutate(data as Customer);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

   if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      <p className="text-slate-600 font-semibold animate-pulse">Müşteriler Yükleniyor...</p>
    </div>
  );

  if (isError) return (
    <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-center font-medium shadow-sm">
      Veriler yüklenirken hata oluştu!
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8 relative">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-bold tracking-wider uppercase">
            <Users size={16} className="text-blue-600" /> Müşteri Yönetimi
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Müşteriler
          </h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-slate-900 text-amber-500 font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={2.5} />
          Yeni Müşteri
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">İletişim</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers?.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors group cursor-default">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-700 font-bold group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                        {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-base tracking-wide">{customer.firstName} {customer.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Mail size={14} className="text-slate-400" /> {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Phone size={14} className="text-slate-400" /> {customer.phoneNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(customer)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        title="Düzenle"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-slate-500 bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users size={48} className="opacity-20 text-slate-400" />
                      <p>Henüz hiç müşteri eklenmemiş.</p>
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
        title={editingCustomer ? "Müşteriyi Düzenle" : "Yeni Müşteri Ekle"}
      >
        <CustomerForm
          initialData={editingCustomer || undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}