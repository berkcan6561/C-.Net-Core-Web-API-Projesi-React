import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-[#0a0f1c]/80 backdrop-blur-md animate-fade-in" 
        onClick={onClose} 
      />
      <div className="relative bg-[#131b2f]/90 border border-white/10 rounded-3xl p-8 w-full max-w-lg animate-slide-in shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        
        {/* Glow effect inside modal */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
