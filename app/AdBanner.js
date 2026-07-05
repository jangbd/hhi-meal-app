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
    <div className="w-full text-center overflow-hidden flex justify-center items-center h-full">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '320px', height: '50px' }}
        data-ad-client="ca-pub-여기에본인ID입력" /* 나중에 애드센스 승인받으면 수정할 곳 */
        data-ad-slot={dataAdSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}