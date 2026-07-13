"use client";

import { useSyncExternalStore } from 'react';
import Script from 'next/script';
import { Capacitor } from '@capacitor/core';

// 💡 네이티브 앱(Android/iOS)에서는 AdMob 네이티브 배너(AdMobBanner)가 대신 뜨므로
// 기존 AdSense 웹 배너는 웹 브라우저에서만 렌더링.
// SSR과 첫 클라이언트 렌더가 항상 일치하도록(하이드레이션 불일치 방지) 서버 스냅샷은
// 항상 "웹"으로 고정하고, 마운트 후에만 실제 네이티브 여부로 안전하게 전환한다.
const subscribe = () => () => {};
const getSnapshot = () => Capacitor.isNativePlatform();
const getServerSnapshot = () => false;

export default function WebAdFooter() {
  const isNative = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (isNative) return null;

  return (
    <footer className="fixed bottom-0 w-full max-w-md mx-auto h-[65px] bg-white border-t border-slate-200 z-[100] flex items-center justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
      <ins className="adsbygoogle"
           style={{ display: 'inline-block', width: '320px', height: '50px' }}
           data-ad-client="ca-pub-1252871302557543"
           data-ad-slot="6653115780"></ins>
      <Script id="adsbygoogle-init" strategy="afterInteractive">
        {`try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}`}
      </Script>
    </footer>
  );
}
