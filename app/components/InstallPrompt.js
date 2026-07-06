'use client';
import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. 기기가 iOS인지 확인
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setIsIOS(true);
      // iOS는 처음 접속 시 3초 뒤에 안내를 띄움
      setTimeout(() => setShowPrompt(true), 3000); 
    }

    // 2. 안드로이드(Chrome) 설치 이벤트 가로채기
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // 설치 팝업 띄우기
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-[#1a1a3c] text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between border border-indigo-500 animate-in slide-in-from-bottom-5">
      <div className="flex-1 pr-3">
        <p className="text-[14px] font-black mb-1">앱으로 더 편하게 보세요! 💎</p>
        {isIOS ? (
          <p className="text-[11px] text-indigo-200 font-bold leading-tight break-keep">
            사파리 하단의 <strong>[공유]</strong> 버튼을 누르고<br/><strong>[홈 화면에 추가]</strong>를 선택하세요.
          </p>
        ) : (
          <p className="text-[11px] text-indigo-200 font-bold leading-tight break-keep">
            바탕화면에 바로가기를 추가하고 1초 만에 식단을 확인하세요.
          </p>
        )}
      </div>
      
      {!isIOS ? (
        <button 
          onClick={handleInstallClick}
          className="bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-black py-2.5 px-4 rounded-xl whitespace-nowrap shadow-md"
        >
          설치하기
        </button>
      ) : (
        <button 
          onClick={() => setShowPrompt(false)}
          className="bg-slate-700 text-white text-[12px] font-bold py-2 px-3 rounded-xl whitespace-nowrap"
        >
          닫기
        </button>
      )}
    </div>
  );
}