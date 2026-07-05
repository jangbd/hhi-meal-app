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
    <div className="w-full text-center overflow-hidden flex justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-1252871302557543" // 💡 유저님의 고유 클라이언트 ID 적용 완료!
        data-ad-slot="3671427905"                // 💡 생성하신 하단배너 슬롯 번호 적용 완료!
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}