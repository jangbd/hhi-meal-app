'use client';
import { useEffect } from 'react';

export default function AdBanner({ dataAdSlot }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
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
        data-ad-client="ca-pub-0000000000000000" /* 💡 승인 후 본인의 클라이언트 ID로 변경 필수! */
        data-ad-slot={dataAdSlot}
        data-ad-test="on" /* 테스트 모드 (개발 중 무효클릭 방지) */
      ></ins>
    </div>
  );
}