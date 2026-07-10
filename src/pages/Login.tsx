import React, { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { Hotel, Sparkles, LogIn } from 'lucide-react';

export function Login(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();   
    const { login } = useAuth();

    const handleSubmit = async (e:React.FormEvent) =>{
        e.preventDefault();
        try{
            const response = await axiosInstance.post('/Auth/login',{ email,password});

            login(response.data.token,{
                userId: response.data.userId,
                customerId: response.data.customerId,
                fullName: response.data.fullName,
                role: response.data.role
            });
            navigate({ to: '/'});
        }catch(err: any){
            setError(err.response?.data || 'Giriş yapılmadı. E-posta veya şifre hatalı.');
        }
    };
    return(
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden p-4">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/30 blue-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/30 blur-[120px] pointer-events-none" />
            <div className="w-full max-w-md bg-[#131b2f]/80 backdrop-blur-x1 border border-white/10 rounded-3xl p-8 relative z-10 shadow-2x1 animate-slide-in">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2x1 bg-gradient-to.tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(7,181,212,0,4)] relative mb-4">
                        <Hotel className="w-4 h-4 text-cyan-200 absolute -top-1 -right-1 annimate-pulse" />
                        <Sparkles className="w-4 h-4 text-cyan-200 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <h1 className="text-3x1 font bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                        HotelHub'a gir
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">Devam etmek için hesabınıza giriş yapın</p>
                </div>
                {error &&(
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-x1 text-sm mb-6 text-center">
                {error}
                </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">E-posta Adresi</label>
                        <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900/50 border-slate-600 text-white rounded-x1 px-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outlince-none transition-colors placeholder-slate-500"
                        placeholder="E-posta adresiniz"         
                   />
                   </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Şifre</label>
                    <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-x1 px-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors placeholder-slate-500"
                    placeholder="........"
                    />
                   </div>
                  <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-x1 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 mt-2"
                  >
                    <LogIn size={20}/>
                    Giriş yap
                  </button>
                </form>
                <div className="mt-6 text-center text-sm text-slate-400">
                    Hesabın yok mu?{' '}
                    <Link to="/register" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
                    Hemen Kayıt Ol
                    </Link>
                </div>
            </div>
        </div>
   );         

}
    