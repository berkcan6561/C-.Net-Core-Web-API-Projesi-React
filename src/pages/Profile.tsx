import { useState, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { Camera, Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export function Profile() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  
  // State'ler
  const [avatar, setAvatar] = useState(user?.avatarUrl ? `http://localhost:5184${user.avatarUrl}` : 'https://ui-avatars.com/api/?name=' + user?.fullName);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backend'den dönen Türkçe hataları yakalayıp mevcut dile çeviren yardımcı fonksiyon
  const getErrorMessage = (errData: any, defaultKey: string) => {
    if (typeof errData === 'string') {
      if (errData.includes('Dosya boyutu')) return t('profile.errors.fileTooLarge');
      if (errData.includes('Sadece resim')) return t('profile.errors.invalidFileType');
      if (errData.includes('Dosya seçilmedi')) return t('profile.errors.noFileSelected');
      if (errData.includes('Mevcut şifreniz yanlış')) return t('profile.errors.wrongPassword');
      return errData;
    }
    return t(defaultKey);
  };

  // Avatar Yükleme İşlemi
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/Auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newAvatarUrl = res.data.avatarUrl;
      setAvatar('http://localhost:5184' + newAvatarUrl); // API portuna göre ayarla
      updateUser({ avatarUrl: newAvatarUrl }); // <--- Global state'i günceller
      toast.success(t('profile.photoSuccess'));
    } catch (err: any) {
      if (err.response?.status !== 429) {
        toast.error(getErrorMessage(err.response?.data, 'profile.photoError'));
      }
    }
  };

  // Şifre Değiştirme İşlemi
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.put('/Auth/change-password', {
        oldPassword,
        newPassword
      });
      toast.success(t('profile.passwordSuccess'));
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      if (err.response?.status !== 429) {
        toast.error(getErrorMessage(err.response?.data, 'profile.passwordError'));
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pt-8">
      <h1 className="text-3xl font-extrabold text-slate-900">{t('profile.title')}</h1>
      
      {message && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-center gap-2 font-medium animate-slide-in">
          <CheckCircle2 size={20} /> {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* AVATAR KISMI */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
            <img src={avatar} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 group-hover:border-blue-100 transition-colors shadow-md" />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-8 h-8" />
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
          <h2 className="text-xl font-bold text-slate-900">{user?.fullName}</h2>
          <p className="text-slate-500 text-sm mt-1">{user?.role === 'Admin' ? t('profile.valuableAdmin') : t('profile.valuableCustomer')}</p>
          <button onClick={() => fileInputRef.current?.click()} className="mt-6 text-sm font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-colors w-full">
            {t('profile.changePhoto')}
          </button>
        </div>

        {/* ŞİFRE DEĞİŞTİRME KISMI */}
        <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Lock className="text-blue-500 w-5 h-5" /> {t('profile.securityAndPassword')}
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('profile.currentPassword')}</label>
              <input 
                type="password" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('profile.newPassword')}</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                required 
              />
            </div>
            <div className="pt-2">
              <button type="submit" className="bg-blue-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all w-full md:w-auto">
                {t('profile.updatePassword')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
