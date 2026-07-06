import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, BedDouble, Users, CalendarCheck, Hotel, Sparkles } from 'lucide-react';

const navItems = [
  { to: '/' as const, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { to: '/rooms' as const, label: 'Odalar', icon: <BedDouble size={20} /> },
  { to: '/customers' as const, label: 'Müşteriler', icon: <Users size={20} /> },
  { to: '/reservations' as const, label: 'Rezervasyonlar', icon: <CalendarCheck size={20} /> },
];

export function Layout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="flex h-screen bg-[#0a0f1c] font-sans text-slate-300 relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-72 glass border-r border-white/5 flex flex-col z-10 shadow-2xl relative">
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
        
        {/* Logo Area */}
        <div className="px-8 py-10 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] relative">
              <Hotel className="w-6 h-6 text-white absolute" />
              <Sparkles className="w-3 h-3 text-cyan-200 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                HotelHub
              </h1>
              <p className="text-[10px] text-cyan-400/80 font-bold tracking-[0.2em] uppercase mt-0.5">Yönetim Paneli</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className="text-xs font-semibold text-slate-500 tracking-wider mb-4 px-4 uppercase">Menü</div>
          {navItems.map((item) => {
            const isActive = item.to === '/' ? currentPath === '/' : currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium
                  transition-all duration-300 group relative overflow-hidden
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,1)]" />
                )}
                
                <span className={`transition-all duration-300 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-slate-500 group-hover:text-cyan-300'}`}>
                  {item.icon}
                </span>
                <span className="tracking-wide z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Mock */}
        <div className="p-4 mb-4 mx-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
            BA
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">Berk C.</h4>
            <p className="text-xs text-slate-400 truncate">Admin</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto p-10 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
