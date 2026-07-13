"use client";

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

// 💡 앱 전체(식단/버스/매칭소/게임 등 모든 페이지)에서 공통으로 뜨는 배너 광고.
// 네이티브 앱(Android/iOS)에서만 동작하며, 웹 브라우저에서는 기존 AdSense 배너를 그대로 사용.
// 실제(운영) 광고 단위 ID를 사용 중이므로, 개발/테스트 기기에서는 반드시 아래 목록에
// 기기를 등록해야 실수로 실제 광고를 시청/클릭해 정책 위반이 되는 것을 막을 수 있음.
const ADMOB_BANNER_ID = 'ca-app-pub-1252871302557543/4251623238';
const ADMOB_TESTING_DEVICES = ['447edb99-09f5-4d08-9438-0eeec804ca41'];
let bannerInitialized = false;

export default function AdMobBanner() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || bannerInitialized) return;
    bannerInitialized = true;

    AdMob.initialize({ initializeForTesting: true, testingDevices: ADMOB_TESTING_DEVICES })
      .then(() => AdMob.showBanner({
        adId: ADMOB_BANNER_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
      }))
      .catch(() => { bannerInitialized = false; });
  }, []);

  return null;
}
