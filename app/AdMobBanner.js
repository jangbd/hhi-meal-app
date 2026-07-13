"use client";

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

// 💡 앱 전체(식단/버스/매칭소/게임 등 모든 페이지)에서 공통으로 뜨는 배너 광고.
// 네이티브 앱(Android/iOS)에서만 동작하며, 웹 브라우저에서는 기존 AdSense 배너를 그대로 사용.
const ADMOB_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
let bannerInitialized = false;

export default function AdMobBanner() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || bannerInitialized) return;
    bannerInitialized = true;

    AdMob.initialize({ initializeForTesting: true })
      .then(() => AdMob.showBanner({
        adId: ADMOB_BANNER_ID,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
      }))
      .catch(() => { bannerInitialized = false; });
  }, []);

  return null;
}
