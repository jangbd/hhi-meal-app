'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';

// 💡 SSR과 첫 클라이언트 렌더가 항상 일치하도록(하이드레이션 불일치 방지) 서버 스냅샷은
// 항상 "웹"으로 고정하고, 마운트 후에만 실제 네이티브 여부로 안전하게 전환한다.
const subscribe = () => () => {};
const getSnapshot = () => Capacitor.isNativePlatform();
const getServerSnapshot = () => false;

export default function AdBanner({ dataAdSlot }) {
  const isNative = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (isNative) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // 💡 "이미 광고가 채워져 있다"는 에러 메시지는 무시하고 종료
      if (err.message && err.message.includes('already have ads')) return;
      console.error('AdSense Error:', err);
    }
  }, [isNative]);

  // 💡 네이티브 앱에서는 전역 AdMob 배너(app/AdMobBanner.js)가 광고를 담당하므로
  // 페이지에 내장된 이 옛 AdSense 배너는 흰 여백만 남기지 않도록 렌더링하지 않음
  if (isNative) return null;

  return (
    // 💡 전체 높이를 60px로 고정하고, 넘치는 부분은 숨기도록 설정(overflow-hidden)
    <div className="w-full h-[60px] flex items-center justify-center overflow-hidden">
      <ins 
        className="adsbygoogle"
        /* 💡 반응형 속성을 빼고 모바일 표준 배너 사이즈(320x50)로 직접 강제 고정! */
        style={{ display: 'inline-block', width: '320px', height: '50px' }}
        data-ad-client="ca-pub-1252871302557543" 
        data-ad-slot={dataAdSlot}
      ></ins>
    </div>
  );
}