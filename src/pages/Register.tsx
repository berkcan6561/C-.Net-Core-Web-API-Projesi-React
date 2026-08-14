import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
// Removed useAuth import as it is no longer needed
import axiosInstance from '../api/axiosInstance';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import lunaLogo from '../assets/luna-logo.png';
import { useTranslation } from 'react-i18next';

export function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/Auth/register', formData);
      // Başarılı kayıtta anasayfaya yönlendir
      alert(t('auth.errors.registerSuccess'));
      navigate({ to: '/login' });
    } catch (err: any) {
      setError(err.response?.data || t('auth.errors.registerFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative p-4">
      {/* Dil Seçici */}
      <div className="absolute top-6 right-6 z-20 flex items-center bg-white rounded-full shadow-sm border border-slate-200 p-1 animate-fade-in">
          {(['tr', 'en', 'de']).map((lng) => (
              <button
                  key={lng}
                  onClick={() => i18n.changeLanguage(lng)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all uppercase ${
                      i18n.language === lng 
                          ? 'bg-amber-500 text-white shadow-md' 
                          : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                  {lng}
              </button>
          ))}
      </div>

      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-8 relative z-10 shadow-2xl animate-slide-in">
        <div className="flex flex-col items-center mb-6">
          <img 
            src={lunaLogo} 
            alt="The Luna Suites Logo" 
            className="w-40 h-auto object-contain mix-blend-multiply mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('auth.registerTitle')}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{t('auth.registerSubtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-2.5 rounded-xl text-sm mb-5 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">{t('auth.firstNameLabel')}</label>
              <input type="text" name="firstName" required onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm" placeholder={t('auth.firstNamePlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">{t('auth.lastNameLabel')}</label>
              <input type="text" name="lastName" required onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm" placeholder={t('auth.lastNamePlaceholder')} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">{t('auth.emailLabel')}</label>
            <input type="email" name="email" required onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm" placeholder={t('auth.emailPlaceholder')} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">{t('auth.phoneLabel')}</label>
            <input type="tel" name="phoneNumber" required onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm" placeholder={t('auth.phonePlaceholder')} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">{t('auth.passwordLabel')}</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                required 
                onChange={handleChange} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 pr-12 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm" 
                placeholder={t('auth.passwordPlaceholder')} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-slate-900 text-amber-500 font-bold py-3 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg mt-4 text-sm">
            <UserPlus size={18} />
            {t('auth.registerButton')}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-500">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-slate-900 font-bold hover:text-amber-600 transition-colors">
            {t('auth.loginNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}