import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { MailCheck, XCircle, Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

export function VerifyEmail() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token;

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-slate-100">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 size={48} className="text-blue-500 animate-spin" />
            <h2 className="text-xl font-bold text-slate-800">Doğrulanıyor...</h2>
            <p className="text-slate-500">Lütfen bekleyin, e-posta adresiniz onaylanıyor.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <MailCheck size={40} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">Tebrikler!</h2>
            <p className="text-slate-600">{message}</p>
            <button
              onClick={() => navigate({ to: '/login' })}
              className="mt-6 w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5"
            >
              Giriş Yap
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
              <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">Doğrulama Başarısız</h2>
            <p className="text-slate-600">{message}</p>
            <button
              onClick={() => navigate({ to: '/login' })}
              className="mt-6 w-full py-3.5 bg-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-300 transition-all"
            >
              Giriş Sayfasına Dön
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
