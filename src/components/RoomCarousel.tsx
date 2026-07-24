import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react';
import { createPortal } from 'react-dom'; 

interface RoomCarouselProps {
  imageUrls?: string[];
}

export function RoomCarousel({ imageUrls }: RoomCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false); 
  const [isDeepZoom, setIsDeepZoom] = useState(false); 

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
        <ImageIcon size={32} className="opacity-50 mb-2" />
        <span className="text-xs font-semibold">Görsel Yok</span>
      </div>
    );
  }

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  return (
    <>
      {/* 1. KÜÇÜK HALİ (Kart İçi Görünüm) */}
      <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden border border-slate-200 group/carousel">
        <img
          src={`http://localhost:5184${imageUrls[currentIndex]}`}
          alt="Oda"
          onClick={(e) => { e.stopPropagation(); setIsZoomed(true); }} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 cursor-pointer"
        />
        
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/60 backdrop-blur-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/60 backdrop-blur-sm"
            >
              <ChevronRight size={18} />
            </button>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imageUrls.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. BÜYÜTÜLMÜŞ HALİ */}
      {isZoomed && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center overflow-hidden"
          onClick={() => { setIsZoomed(false); setIsDeepZoom(false); }} 
        >
          {/* Kapat (X) Butonu */}
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-red-500 p-3 rounded-full transition-all z-[100000]"
            onClick={(e) => { e.stopPropagation(); setIsZoomed(false); setIsDeepZoom(false); }}
          >
            <X size={28} />
          </button>

          {/* İleri / Geri Okları (Zoom modunda değilken görünsün) */}
          {imageUrls.length > 1 && !isDeepZoom && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImg(e); }}
                className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-4 rounded-full backdrop-blur-md transition-all z-[100000]"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImg(e); }}
                className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-4 rounded-full backdrop-blur-md transition-all z-[100000]"
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}

          {/* Tam Ekran Resim */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-8 overflow-auto scrollbar-hide"
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsDeepZoom(!isDeepZoom); 
            }}
          >
            <img
              src={`http://localhost:5184${imageUrls[currentIndex]}`}
              alt="Oda Büyük Görsel"
              className={`transition-all duration-300 ease-out ${
                isDeepZoom 
                  ? 'scale-[2.0] cursor-zoom-out' 
                  : 'scale-100 max-h-screen object-contain cursor-zoom-in'
              } shadow-2xl rounded-lg`}
            />
          </div>
        </div>,
        document.body 
      )}
    </>
  );
}