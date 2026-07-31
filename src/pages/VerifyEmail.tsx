import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { MailCheck, XCircle, Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useTranslation } from 'react-i18next';

export function VerifyEmail() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token;
  const { t, i18n } = useTranslation();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(!token ? 'error' : 'loading');
  const [message, setMessage] = useState(!token ? 'Geçersiz doğrulama bağlantısı.' : '');
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token) return;

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const verifyToken = async () => {
      try {
        const response = await axiosInstance.get(`/Auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'E-posta adresiniz başarıyla onaylandı.');
      } catch (err: any) {
        console.error("Verification Error:", err);
        setStatus('error');
        setMessage(err.response?.data?.message || err.response?.data || `Doğrulama işlemi başarısız oldu (Hata Kodu: ${err.response?.status || 'Bilinmiyor'}).`);
      }
    };

    verifyToken();
  }, [token]);

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

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-slate-100 relative z-10">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 size={48} className="text-blue-500 animate-spin" />
            <h2 className="text-xl font-bold text-slate-800">{t('pages.verifyEmail.verifying')}</h2>
            <p className="text-slate-500">{t('pages.verifyEmail.wait')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <MailCheck size={40} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">{t('pages.verifyEmail.success')}</h2>
            <p className="text-slate-600">{message}</p>
            <button
              onClick={() => navigate({ to: '/login' })}
              className="mt-6 w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5"
            >
              {t('pages.verifyEmail.loginButton')}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
              <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">{t('pages.verifyEmail.error')}</h2>
            <p className="text-slate-600">{message}</p>
            <button
              onClick={() => navigate({ to: '/login' })}
              className="mt-6 w-full py-3.5 bg-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-300 transition-all"
            >
              {t('pages.forgotPassword.backToLogin')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
