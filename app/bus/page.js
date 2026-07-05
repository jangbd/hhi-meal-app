'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function BusInfo() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mainTab, setMainTab] = useState('shuttle');
  const [subTab, setSubTab] = useState('commute');
  
  // 💡 클릭한 이미지를 전체화면으로 띄우기 위한 상태
  const [selectedImage, setSelectedImage] = useState(null);

  // 슈파베이스 스토리지 기본 주소
  const storageBaseUrl = "https://jboyyhqyrwscrpanyywq.supabase.co/storage/v1/object/public/bus-schedules";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 max-w-md mx-auto relative">
      
      {/* 상단 앱바 */}
      <header className="sticky top-0 z-30 bg-[#1a1a3c] text-white px-4 h-14 flex items-center justify-between shadow-md">
        <button onClick={() => window.location.href='/'} className="p-2 -ml-2 text-xl hover:text-indigo-300">←</button>
        <h1 className="text-[15px] font-black tracking-tight">버스 시간표</h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-xl">☰</button>
      </header>

      {/* 햄버거 메뉴 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-2xl p-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-[#1a1a3c]">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 text-xl font-bold">✕</button>
            </div>
            <nav className="space-y-3">
              <Link href="/" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">🍱 식단</Link>
              <Link href="/bus" className="block py-3.5 px-4 bg-indigo-50 text-indigo-800 rounded-xl font-bold">🚌 버스 시간표</Link>
              <Link href="/points" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">💎 칭찬 포인트 매칭소</Link>
              <Link href="/settings" className="block py-3.5 px-4 text-slate-600 hover:bg-slate-50 rounded-xl font-bold">⚙️ 설정</Link>
            </nav>
          </div>
        </div>
      )}

      {/* 메인 탭 */}
      <div className="sticky top-14 z-20 bg-white border-b border-slate-200 flex overflow-x-auto scrollbar-hide shadow-sm">
        <button
          onClick={() => setMainTab('shuttle')}
          className={`flex-none w-1/3 py-3.5 text-[14px] font-black transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            mainTab === 'shuttle' ? 'border-indigo-600 text-indigo-900 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">🏢</span> 사내 버스
        </button>
        <button
          onClick={() => setMainTab('haeyang')}
          className={`flex-none w-1/3 py-3.5 text-[14px] font-black transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            mainTab === 'haeyang' ? 'border-indigo-600 text-indigo-900 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">🌊</span> 해양 버스
        </button>
        <button
          onClick={() => setMainTab('commuter')}
          className={`flex-none w-1/3 py-3.5 text-[14px] font-black transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            mainTab === 'commuter' ? 'border-indigo-600 text-indigo-900 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">🏠</span> 통근 버스
        </button>
      </div>

      <main className="p-4 mt-2 pb-20">
        
        {/* =========================================
            A. 사내 버스 화면
            ========================================= */}
        {mainTab === 'shuttle' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6">
              {/* 💡 요청하신 "확대해서 보세요" 문구 삭제 */}
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-black text-indigo-950 text-[15px]">🗺️ 전체 노선도</h3>
              </div>
              <img 
                src={`${storageBaseUrl}/shuttle_map.png`} 
                alt="사내 버스 전체 노선도" 
                // 💡 이미지 클릭 시 selectedImage에 주소 저장 (확대 기능)
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
                🌅 출퇴근 운행
              </button>
              <button 
                onClick={() => setSubTab('work')}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-black transition-all ${
                  subTab === 'work' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500'
                }`}
              >
                🔄 근무시간 운행
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

        {/* =========================================
            B. 해양 버스 화면
            ========================================= */}
        {mainTab === 'haeyang' && (
          <div className="animate-in fade-in duration-300">
            {/* 💡 요청하신 해양 버스 안내 문구 박스 전체 삭제 */}
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

        {/* =========================================
            C. 통근 버스 화면
            ========================================= */}
        {mainTab === 'commuter' && (
          <div className="animate-in fade-in duration-300">
            {/* 💡 요청하신 통근 버스 안내 문구 박스 전체 삭제 */}
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

      {/* 💡 이미지 전체화면 확대 모달 (팝업) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-2 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)} // 여백 클릭 시 닫힘
        >
          {/* 닫기 버튼 */}
          <button 
            className="absolute top-4 right-4 text-white text-3xl font-black p-4 z-[101]"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
          
          {/* 확대된 이미지 영역 (스크롤 가능) */}
          <div className="relative w-full h-full flex items-center justify-center overflow-auto">
            <img 
              src={selectedImage} 
              alt="확대된 시간표" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()} // 이미지를 클릭했을 때는 창이 안 닫히게 방지
            />
          </div>
        </div>
      )}
      
    </div>
  );
}