'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdBanner from '../AdBanner'; 
import { dict } from '../i18n'; 

const busDict = {
  ko: { title: "버스 시간표", inhouse: "사내 버스", ocean: "해양 버스", commute: "통근 버스", map: "전체 노선도", rush: "출퇴근 운행", regular: "근무시간 운행" },
  en: { title: "Bus Schedule", inhouse: "In-house", ocean: "Ocean", commute: "Commuter", map: "Route Map", rush: "Rush Hour", regular: "Working Hours" },
  vi: { title: "Lịch xe buýt", inhouse: "Nội bộ", ocean: "Hải dương", commute: "Đi làm", map: "Bản đồ", rush: "Giờ cao điểm", regular: "Giờ hành chính" },
  zh: { title: "班车时刻表", inhouse: "厂내班车", ocean: "海洋班车", commute: "通勤班车", map: "路线图", rush: "上下班", regular: "工作时间" },
  uz: { title: "Avtobus jadvali", inhouse: "Ichki", ocean: "Okean", commute: "Qatnov", map: "Xarita", rush: "Tig'iz vaqt", regular: "Odatiy" },
  si: { title: "බස් කාලසටහන", inhouse: "ඇතුළත", ocean: "සාගර", commute: "මගී", map: "සිතියම", rush: "කාර්යබහුල", regular: "සාමාන්‍ย" },
  id: { title: "Jadwal Bus", inhouse: "Internal", ocean: "Laut", commute: "Komuter", map: "Peta Rute", rush: "Jam Sibuk", regular: "Reguler" },
  tl: { title: "Iskedyul ng Bus", inhouse: "Kumpanya", ocean: "Karagatan", commute: "Komyuter", map: "Mapa", rush: "Rush Hour", regular: "Regular" },
  ru: { title: "Расписание", inhouse: "Внутренний", ocean: "Морской", commute: "Служебный", map: "Карта", rush: "Часы пик", regular: "Обычный" },
  th: { title: "ตารางรถบัส", inhouse: "ภายใน", ocean: "ทางทะเล", commute: "รับส่ง", map: "แผนที่", rush: "ชั่วโมงเร่งด่วน", regular: "เวลาปกติ" }
};

export default function BusInfo() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mainTab, setMainTab] = useState('shuttle');
  const [subTab, setSubTab] = useState('commute');
  const [selectedImage, setSelectedImage] = useState(null);
  const [lang, setLang] = useState('ko');

  useEffect(() => {
    const savedLang = localStorage.getItem('my_language') || 'ko';
    setLang(savedLang);
  }, []);

  const t = dict[lang] || dict.ko; 
  const bt = busDict[lang] || busDict.ko; 

  const storageBaseUrl = "https://jboyyhqyrwscrpanyywq.supabase.co/storage/v1/object/public/bus-schedules";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 max-w-md mx-auto relative flex flex-col">
      
      <header className="sticky top-0 z-30 bg-[#1a1a3c] text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => window.location.href='/'} className="p-2 -ml-2 text-xl hover:text-indigo-300">←</button>
        <h1 className="text-[15px] font-black tracking-tight">{bt.title}</h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl">☰</button>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-2xl p-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-[#1a1a3c]">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 text-xl font-bold p-2">✕</button>
            </div>
            <nav className="space-y-3">
              <Link href="/" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">{t.menu_meal}</Link>
              <Link href="/bus" className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">{t.menu_bus}</Link>
              <Link href="/points" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">{t.menu_points || '💎 HD핵심가치 포인트 매칭소'}</Link>
              <Link href="/game" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">{t.menu_game || '⚔️ 강화의 신'}</Link>
              <Link href="/settings" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">{t.menu_settings}</Link>
            </nav>
          </div>
        </div>
      )}

      <div className="sticky top-14 z-20 bg-white border-b border-slate-200 flex overflow-x-auto scrollbar-hide shadow-sm">
        <button
          onClick={() => setMainTab('shuttle')}
          className={`flex-none w-1/3 py-3.5 text-[14px] font-black transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            mainTab === 'shuttle' ? 'border-indigo-600 text-indigo-900 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">🏢</span> {bt.inhouse}
        </button>
        <button
          onClick={() => setMainTab('haeyang')}
          className={`flex-none w-1/3 py-3.5 text-[14px] font-black transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            mainTab === 'haeyang' ? 'border-indigo-600 text-indigo-900 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">🌊</span> {bt.ocean}
        </button>
        <button
          onClick={() => setMainTab('commuter')}
          className={`flex-none w-1/3 py-3.5 text-[14px] font-black transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            mainTab === 'commuter' ? 'border-indigo-600 text-indigo-900 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">🏠</span> {bt.commute}
        </button>
      </div>

      <main className="flex-1 p-4 mt-2 pb-20">
        {mainTab === 'shuttle' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-black text-indigo-950 text-[15px]">🗺️ {bt.map}</h3>
              </div>
              <img 
                src={`${storageBaseUrl}/shuttle_map.png`} 
                alt="사내 버스 전체 노선도" 
                onClick={() => setSelectedImage(`${storageBaseUrl}/shuttle_map.png`)}
                className="w-full h-auto rounded-[1.5rem] bg-white border border-slate-200 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            <div className="bg-slate-100 p-1.5 rounded-2xl flex mb-5 shadow-inner border border-slate-200/50">
              <button 
                onClick={() => setSubTab('commute')}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-black transition-all ${
                  subTab === 'commute' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500'
                }`}
              >
                🌅 {bt.rush}
              </button>
              <button 
                onClick={() => setSubTab('work')}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-black transition-all ${
                  subTab === 'work' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500'
                }`}
              >
                🔄 {bt.regular}
              </button>
            </div>

            <div className="space-y-4">
              {Array.from({ length: 15 }).map((_, index) => {
                const imgUrl = `${storageBaseUrl}/shuttle_${subTab}/shuttle_${subTab}${index + 1}.png`;
                return (
                  <img 
                    key={`shuttle-${subTab}-${index}`}
                    src={imgUrl}
                    alt={`사내 버스 시간표 ${index + 1}`} 
                    onClick={() => setSelectedImage(imgUrl)}
                    className="w-full h-auto rounded-[1.5rem] bg-white border border-slate-200 shadow-sm cursor-pointer active:scale-[0.98] transition-transform animate-in zoom-in-95 duration-300"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {mainTab === 'haeyang' && (
          <div className="animate-in fade-in duration-300">
            <div className="space-y-4 mt-2">
              {Array.from({ length: 10 }).map((_, index) => {
                const imgUrl = `${storageBaseUrl}/haeyang/haeyang${index + 1}.png`;
                return (
                  <img 
                    key={`haeyang-${index}`}
                    src={imgUrl}
                    alt={`해양 버스 시간표 ${index + 1}`} 
                    onClick={() => setSelectedImage(imgUrl)}
                    className="w-full h-auto rounded-[1.5rem] bg-white border border-slate-200 shadow-sm cursor-pointer active:scale-[0.98] transition-transform animate-in zoom-in-95 duration-300"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {mainTab === 'commuter' && (
          <div className="animate-in fade-in duration-300">
            <div className="space-y-4 mt-2">
              {Array.from({ length: 20 }).map((_, index) => {
                const imgUrl = `${storageBaseUrl}/commuter/commuter${index + 1}.png`;
                return (
                  <img 
                    key={`commuter-${index}`}
                    src={imgUrl}
                    alt={`통근 버스 시간표 ${index + 1}`} 
                    onClick={() => setSelectedImage(imgUrl)}
                    className="w-full h-auto rounded-[1.5rem] bg-white border border-slate-200 shadow-sm cursor-pointer active:scale-[0.98] transition-transform animate-in zoom-in-95 duration-300"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-2 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)} 
        >
          <button 
            className="absolute top-4 right-4 text-white text-3xl font-black p-4 z-[101]"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
          <div className="relative w-full h-full flex items-center justify-center overflow-auto">
            <img 
              src={selectedImage} 
              alt="확대된 시간표" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
      
      <div className="w-full flex items-center justify-center bg-gray-50 border-t sticky bottom-0 z-40">
        <AdBanner dataAdSlot="3671427905" /> 
      </div>
    </div>
  );
}