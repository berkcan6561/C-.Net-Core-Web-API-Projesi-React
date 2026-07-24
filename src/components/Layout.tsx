import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, BedDouble, Users, CalendarCheck, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import lunaLogo from '../assets/luna-logo.png';

export function Layout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, logout, isAdmin } = useAuth(); 
  const { currency, setCurrency } = useCurrency();

  
  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} />, show: true },
    { to: '/rooms', label: 'Odalar', icon: <BedDouble size={20} />, show: isAdmin },
    { to: '/customers', label: 'Müşteriler', icon: <Users size={20} />, show: isAdmin },
    { to: '/reservations', label: 'Rezervasyonlar', icon: <CalendarCheck size={20} />, show: isAdmin },
    { to: '/profile', label: 'Profilim', icon: <UserIcon size={20} />, show: true },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login'; 
  };

  return (

    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Sidebar (Sol Menü) */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm relative">
        
        {/* Logo Alanı */}
        <div className="px-8 py-8 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white rounded-xl shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] flex items-center justify-center p-1.5 border border-slate-100/80">
              <img src={lunaLogo} alt="The Luna Suites Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                The Luna Suites
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase mt-0.5">
                {isAdmin ? 'Yönetim Paneli' : 'Müşteri Paneli'}
              </p>
            </div>
          </div>
        </div>

        {/* Menü Linkleri */}
        <nav className="flex-1 px-4 space-y-1.5">
          <div className="text-xs font-bold text-slate-400 tracking-wider mb-4 px-4 uppercase">
            Ana Menü
          </div>
          
          {navItems.filter(item => item.show).map((item) => {
            const isActive = item.to === '/' ? currentPath === '/' : currentPath.startsWith(item.to);
            return (
               <Link
                key={item.to}
                to={item.to}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200 group
                  ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }
                `}
              >
                <span className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'} transition-colors`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Kullanıcı Profili & Çıkış Yap */}
        <div className="p-4 m-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
             {/* Profil Avatarı */}
            <div className="w-9 h-9 rounded-full flex-shrink-0 bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm overflow-hidden">
              {user?.avatarUrl ? (
                <img src={`http://localhost:5184${user.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.charAt(0) || 'U'
              )}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-slate-900 truncate">{user?.fullName || 'Misafir'}</h4>
              <p className="text-xs text-slate-500 truncate">{user?.role || 'Kullanıcı'}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Çıkış Yap"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Üst Bar: Para Birimi Seçici */}
        <div className="absolute top-6 right-8 lg:right-12 z-20 flex items-center bg-white rounded-full shadow-sm border border-slate-200 p-1">
          {(['TRY', 'USD', 'EUR'] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                currency === curr 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {curr === 'TRY' ? '₺' : curr === 'USD' ? '$' : '€'}
            </button>
          ))}
        </div>

        {/* Sayfaların (Dashboard, Rooms vs.) render edildiği yer */}
        <div className="max-w-7xl mx-auto p-8 lg:p-12 h-full mt-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}