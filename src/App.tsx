import { useQuery } from '@tanstack/react-query';
import { getRooms } from './api/roomService';
import { useTranslation } from 'react-i18next';


function App() {
  const { t } = useTranslation();

  // TanStack Query ile veriyi çekiyoruz
  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
  });

  if (isLoading) return <div className="text-white p-10">{t('pages.rooms.loadingRooms')}</div>;
  if (error) return <div className="text-red-500 p-10">{t('pages.rooms.loadError')}</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-10">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6">{t('pages.rooms.pageTitle')}</h1>
      
      <div className="grid gap-4">
        {data?.map((room) => (
          <div key={room.id} className="bg-slate-800 p-4 rounded-lg text-white border border-slate-700">
            <h2 className="text-xl font-semibold">Oda No: {room.roomNumber}</h2>
            <p>Kapasite: {room.capacity} Kişilik</p>
            <p className="text-cyan-300">Fiyat: {room.pricePerNight} TL</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;