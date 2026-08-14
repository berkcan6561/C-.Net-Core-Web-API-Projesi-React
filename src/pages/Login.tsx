import React, { useState, useRef } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { LogIn, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import lunaLogo from '../assets/luna-logo.png';
import { Modal } from '../components/Modal';
import { useTranslation } from 'react-i18next';
import ReCaptcha from 'react-google-recaptcha';

export function Login(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isBannedModalOpen, setIsBannedModalOpen] = useState(false);
    const [bannedMessage, setBannedMessage] = useState('');
    const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [resendMessage, setResendMessage] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(() => {
        const saved = sessionStorage.getItem('loginFailedAttempts');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [showResendButton, setShowResendButton] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const recaptchaRef = useRef<ReCaptcha>(null);
    
    const navigate = useNavigate();   
    const { login } = useAuth();
    const { t, i18n } = useTranslation();

    const handleSubmit = async (e:React.FormEvent) =>{
        e.preventDefault();
        try{
            const response = await axiosInstance.post('/Auth/login', {
                email,
                password,
                recaptchaToken: captchaToken ?? undefined
            });

            login(response.data.token,{
                userId: response.data.userId,
                customerId: response.data.customerId,
                fullName: response.data.fullName,
                role: response.data.role,
                avatarUrl: response.data.avatarUrl
            });
            // Clear attempts
            sessionStorage.removeItem('loginFailedAttempts');
            setFailedAttempts(0);
            navigate({ to: '/'});
        }catch(err: any){
            // Reset captcha
            if(recaptchaRef.current) recaptchaRef.current.reset();
            setCaptchaToken(null);

            // Parse error
            let errorMessage = '';
            if (typeof err.response?.data === 'string') {
                errorMessage = err.response.data;
            } else if (err.response?.data?.title) {
                errorMessage = err.response.data.title;
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }

            if (err.response?.status === 429) {
                // Rate limit exceeded
                setError(t('auth.errors.tooManyRequests'));
            } else if (errorMessage.startsWith('ERR_ACCOUNT_LOCKED|')) {
                // Account locked
                const minutes = errorMessage.split('|')[1];
                setBannedMessage(t('auth.errors.accountLockedParams', { minutes }));
                setIsBannedModalOpen(true);
                setError('');
            } else if (errorMessage === 'ERR_RECAPTCHA_REQUIRED') {
                setError(t('auth.errors.recaptchaRequired'));
            } else if (errorMessage === 'ERR_RECAPTCHA_FAILED') {
                setError(t('auth.errors.recaptchaFailed'));
            } else if (errorMessage === 'ERR_EMAIL_UNVERIFIED') {
                setShowResendButton(true);
                setError(t('auth.errors.emailUnverified'));
            } else if (errorMessage === 'ERR_TOO_MANY_ATTEMPTS') {
                setBannedMessage(t('auth.errors.tooManyAttemptsBan'));
                setIsBannedModalOpen(true);
                setError('');
            } else {
                // Invalid credentials
                setShowResendButton(false);
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);
                sessionStorage.setItem('loginFailedAttempts', newAttempts.toString());
                setError(t('auth.errors.invalidLogin'));
            }
        }
    };

    const handleResendEmail = async () => {
        if (!email) return;
        setResendStatus('loading');
        try {
            await axiosInstance.post('/Auth/resend-verification-email', { email });
            setResendStatus('success');
            setResendMessage(t('auth.errors.resendSuccess'));
        } catch (err: any) {
            setResendStatus('error');
            setResendMessage(t('auth.errors.resendWait'));
        }
    };

    return(
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative p-4">
            {/* Language selector */}
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
                        {t('auth.loginTitle')}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">{t('auth.loginSubtitle')}</p>
                </div>
                {error &&(
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm mb-5 text-center font-medium flex flex-col items-center gap-2">
                    <span>{error}</span>
                    {showResendButton && (
                        <div className="mt-2 flex flex-col items-center w-full">
                            <button 
                                onClick={handleResendEmail}
                                disabled={resendStatus === 'loading'}
                                className="bg-white border border-red-200 text-red-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {resendStatus === 'loading' ? t('auth.errors.resending') : t('auth.errors.resendEmail')}
                            </button>
                            {resendMessage && (
                                <span className={`mt-2 text-xs font-semibold ${resendStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {resendMessage}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">{t('auth.emailLabel')}</label>
                        <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm"
                        placeholder={t('auth.emailPlaceholder')}         
                   />
                   </div>
                   <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('auth.passwordLabel')}</label>
                        <Link to="/forgot-password" className="text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors">
                            {t('auth.forgotPassword')}
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-4 pr-12 py-2.5 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder-slate-400 text-sm"
                            placeholder={t('auth.passwordPlaceholder')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-full hover:bg-slate-200/50 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                   </div>
                   {failedAttempts >= 3 && (
                       <div className="flex justify-center mt-2">
                           <ReCaptcha
                               ref={recaptchaRef}
                               sitekey="6LfsfIUtAAAAAB0WRWqqrl_FyW8ZHu-q7zUL0zyC"
                               onChange={(token) => setCaptchaToken(token)}
                               hl={i18n.language}
                           />
                       </div>
                   )}
                  <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-amber-500 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg mt-4 text-sm"
                  >
                    <LogIn size={18}/>
                    {t('auth.loginButton')}
                  </button>
                </form>
                <div className="mt-5 text-center text-sm text-slate-500">
                    {t('auth.noAccount')}{' '}
                    <Link to="/register" className="text-slate-900 font-bold hover:text-amber-600 transition-colors">
                    {t('auth.registerNow')}
                    </Link>
                </div>
            </div>

            <Modal 
                isOpen={isBannedModalOpen} 
                onClose={() => setIsBannedModalOpen(false)} 
                title={t('auth.errors.bannedTitle')}
            >
                <div className="flex flex-col items-center justify-center text-center gap-4 py-4">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2 animate-bounce">
                        <ShieldAlert size={40} strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{t('auth.errors.bannedSubtitle')}</h3>
                    <p className="text-slate-600 font-medium bg-red-50 p-4 border border-red-100 rounded-2xl">
                        {bannedMessage}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                        {t('auth.errors.bannedInfo')}
                    </p>
                    <button 
                        onClick={() => setIsBannedModalOpen(false)}
                        className="mt-4 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md"
                    >
                        {t('auth.errors.bannedButton')}
                    </button>
                </div>
            </Modal>
        </div>
   );         
}


    