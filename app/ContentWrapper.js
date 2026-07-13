"use client";

import { useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';

// 💡 웹에서는 기존 AdSense 하단 배너 높이만큼 여백을 예약해야 하지만,
// 네이티브 앱에서는 AdMob 배너가 별도 네이티브 뷰로 화면 위에 떠 있어서
// 이 여백이 그대로 흰 빈 공간으로 남는 문제가 있었음. 네이티브에서는 여백 제거.
const subscribe = () => () => {};
const getSnapshot = () => Capacitor.isNativePlatform();
const getServerSnapshot = () => false;

export default function ContentWrapper({ children }) {
  const isNative = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className={`max-w-md mx-auto min-h-screen bg-white shadow-2xl relative ${isNative ? '' : 'pb-[65px]'}`}>
      {children}
    </div>
  );
}
