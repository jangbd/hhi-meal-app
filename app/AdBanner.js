'use client';
import { useEffect } from 'react';

export default function AdBanner({ dataAdSlot }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // 💡 "이미 광고가 채워져 있다"는 에러 메시지는 무시하고 종료
      if (err.message && err.message.includes('already have ads')) return;
      console.error('AdSense Error:', err);
    }
  }, []);

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