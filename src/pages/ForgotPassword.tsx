import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import lunaLogo from '../assets/luna-logo.png';
import { useTranslation } from 'react-i18next';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const response = await axiosInstance.post('/Auth/forgot-password', { email });
      setStatus('success');
      setMessage(response.data.message || 'Şifre sıfırlama bağlantısı gönderildi.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || err.response?.data || 'Bir hata oluştu. Lütfen tekrar deneyin.');
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('pages.forgotPassword.title')}</h1>
          <p className="text-slate-500 mt-2">{t('pages.forgotPassword.desc')}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          
          {status === 'success' ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Bağlantı Gönderildi</h2>
              <p className="text-slate-600 mb-6">{message}</p>
              <button
                onClick={() => navigate({ to: '/login' })}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5"
              >
                <ArrowLeft size={18} />
                {t('pages.forgotPassword.backToLogin')}
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
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">{t('pages.forgotPassword.emailLabel')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                    placeholder={t('pages.forgotPassword.emailPlaceholder')}
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3.5 bg-slate-900 text-amber-500 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <>
                    <Mail size={20} />
                    {t('pages.forgotPassword.sendButton')}
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate({ to: '/login' })}
                  className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  {t('pages.forgotPassword.backToLogin')}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
