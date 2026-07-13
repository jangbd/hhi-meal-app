"use client";

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize, BannerAdPluginEvents } from '@capacitor-community/admob';

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

    // 💡 배너 실제 렌더링 높이는 기기/화면폭/광고 크리에이티브에 따라 달라지므로
    // 하드코딩 대신 실제 로드된 크기를 감지해 CSS 변수로 전체 앱에 전파한다.
    // (레이아웃/게임 페이지의 하단 여백은 이 변수를 참조해 자동으로 맞춰짐)
    // 💡 중요: 안드로이드 15+에서는 배너가 시스템 네비게이션 바 높이만큼 추가로
    // 위로 밀려 올라간다(BannerExecutor의 systemWindowInsetBottom 마진 처리).
    // 배너 "높이"만 여백에 반영하면 이 밀려 올라간 만큼의 공간이 비어서
    // 그 자리에 페이지 콘텐츠가 그대로 비쳐 보이는 문제가 있었음.
    // 시스템 네비게이션 바(3버튼 기준 약 130px)까지 안전하게 포함해 여유를 둔다.
    const INSET_BUFFER = 130;
    // SizeChanged 이벤트가 늦게 오거나 안 올 경우를 대비해, 네이티브에서는
    // 우선 넉넉한 안전값으로 미리 세팅해둔다.
    document.documentElement.style.setProperty('--ad-clearance', `${120 + INSET_BUFFER}px`);

    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
      if (info?.height > 0) {
        document.documentElement.style.setProperty('--ad-clearance', `${info.height + INSET_BUFFER}px`);
      }
    }).catch(() => {});

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
