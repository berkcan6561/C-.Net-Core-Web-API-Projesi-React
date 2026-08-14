import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import type { Customer } from '../types/customer';

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: Omit<Customer, 'id'> | Customer) => void;
  onCancel: () => void;
}

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

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
      onSubmit({ firstName, lastName, email, phoneNumber, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.customers.firstName')}</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 placeholder-slate-400 text-sm"
            placeholder={t('pages.customers.firstNamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.customers.lastName')}</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 placeholder-slate-400 text-sm"
            placeholder={t('pages.customers.lastNamePlaceholder')}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.customers.email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 placeholder-slate-400 text-sm"
          placeholder={t('pages.customers.emailPlaceholder')}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.customers.phone')}</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 placeholder-slate-400 text-sm"
          placeholder={t('pages.customers.phonePlaceholder')}
        />
      </div>

      {!initialData && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.customers.password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-slate-100 outline-none transition-colors duration-200 placeholder-slate-400 text-sm"
            placeholder={t('pages.customers.passwordPlaceholder')}
          />
          <p className="text-[11px] text-slate-500 mt-1">{t('pages.customers.passwordHint')}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 px-4 rounded-xl hover:bg-slate-200 transition-all text-sm"
        >{t('pages.customers.cancel')}</button>
        <button
          type="submit"
          className="flex-1 bg-slate-900 text-amber-500 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all shadow-md text-sm"
        >{t('pages.customers.save')}</button>
      </div>
    </form>
  );
}
