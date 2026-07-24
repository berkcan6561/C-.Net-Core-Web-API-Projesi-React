import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
// Removed useAuth import as it is no longer needed
import axiosInstance from '../api/axiosInstance';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import lunaLogo from '../assets/luna-logo.png';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/Auth/register', formData);
      // login() fonksiyonunu çağırmıyoruz çünkü henüz e-posta onayı yok!
      alert('Kayıt başarılı! Lütfen giriş yapmadan önce e-posta adresinize gelen linke tıklayarak hesabınızı onaylayın.');
      navigate({ to: '/login' });
    } catch (err: any) {
      setError(err.response?.data || 'Kayıt işlemi başarısız oldu.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-8 relative z-10 shadow-2xl animate-slide-in">
        <div className="flex flex-col items-center mb-6">
          <img 
            src={lunaLogo} 
            alt="The Luna Suites Logo" 
            className="w-40 h-auto object-contain mix-blend-multiply mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Aramıza Katıl
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Hemen hesap oluşturun ve rezervasyon yapın.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-2.5 rounded-xl text-sm mb-5 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Ad</label>
              <input type="text" name="firstName" required onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm" placeholder="Adınız" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Soyad</label>
              <input type="text" name="lastName" required onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm" placeholder="Soyadınız" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">E-posta</label>
            <input type="email" name="email" required onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm" placeholder="E-Posta adresiniz" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Telefon</label>
            <input type="tel" name="phoneNumber" required onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm" placeholder="Telefon numaranız" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Şifre</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                required 
                onChange={handleChange} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 pr-12 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm" 
                placeholder="••••••••" 
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
            Kayıt Ol
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-500">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="text-slate-900 font-bold hover:text-amber-600 transition-colors">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}