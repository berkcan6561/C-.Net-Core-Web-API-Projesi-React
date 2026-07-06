import { useState, useEffect } from 'react';
import type { Customer } from '../types/customer';

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: Omit<Customer, 'id'> | Customer) => void;
  onCancel: () => void;
}

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName);
      setLastName(initialData.lastName);
      setEmail(initialData.email);
      setPhoneNumber(initialData.phoneNumber);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      onSubmit({ id: initialData.id, firstName, lastName, email, phoneNumber });
    } else {
      onSubmit({ firstName, lastName, email, phoneNumber });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Ad</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors duration-200 placeholder-slate-500"
            placeholder="Ör: Ahmet"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Soyad</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors duration-200 placeholder-slate-500"
            placeholder="Ör: Yılmaz"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">E-posta</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors duration-200 placeholder-slate-500"
          placeholder="Ör: ahmet@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Telefon</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors duration-200 placeholder-slate-500"
          placeholder="Ör: 0532 123 4567"
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
