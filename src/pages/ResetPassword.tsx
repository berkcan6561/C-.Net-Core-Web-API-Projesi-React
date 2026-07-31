import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import lunaLogo from '../assets/luna-logo.png';
import { useTranslation } from 'react-i18next';

export function ResetPassword() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token;
  const { t, i18n } = useTranslation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(!token ? 'error' : 'idle');
  const [message, setMessage] = useState(!token ? 'Geçersiz şifre sıfırlama bağlantısı.' : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await axiosInstance.post('/Auth/reset-password', { token, newPassword: password });
      setStatus('success');
      setMessage(response.data.message || 'Şifreniz başarıyla güncellendi.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || err.response?.data || 'Şifre sıfırlama işlemi başarısız oldu.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
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

      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <img src={lunaLogo} alt="Luna Suites Logo" className="h-16 mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('pages.resetPassword.title')}</h1>
          <p className="text-slate-500 mt-2 text-sm px-4">{t('pages.resetPassword.desc')}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          
          {status === 'success' ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{t('pages.resetPassword.success')}</h2>
              <p className="text-slate-600 mb-6">{message}</p>
              <button
                onClick={() => navigate({ to: '/login' })}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5"
              >
                {t('pages.verifyEmail.loginButton')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {status === 'error' && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 text-center">
                  {message}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.resetPassword.passwordLabel')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                    placeholder="••••••••"
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('pages.resetPassword.passwordLabel')} (Tekrar)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                    placeholder="••••••••"
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || !token}
                className="w-full py-3.5 bg-slate-900 text-amber-500 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center"
              >
                {status === 'loading' ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  t('pages.resetPassword.saveButton')
                )}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
