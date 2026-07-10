import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { Hotel, UserPlus } from 'lucide-react';

export function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/Auth/register', formData);
      login(response.data.token, {
        userId: response.data.userId,
        customerId: response.data.customerId,
        fullName: response.data.fullName,
        role: response.data.role
      });
      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.response?.data || 'Kayıt işlemi başarısız oldu.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden p-4">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-900/30 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#131b2f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl animate-slide-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] mb-3">
            <Hotel className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-violet-400">
            Aramıza Katıl
          </h1>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ad</label>
              <input type="text" name="firstName" required onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm" placeholder="Ahmet" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Soyad</label>
              <input type="text" name="lastName" required onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm" placeholder="Yılmaz" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">E-posta</label>
            <input type="email" name="email" required onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm" placeholder="ahmet@email.com" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Telefon</label>
            <input type="tel" name="phoneNumber" required onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm" placeholder="0532 123 4567" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Şifre</label>
            <input type="password" name="password" required onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm" placeholder="••••••••" />
          </div>

          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold py-3 rounded-xl hover:from-violet-400 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20 mt-4 text-sm">
            <UserPlus size={18} />
            Kayıt Ol
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-400">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}