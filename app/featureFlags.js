// 💡 스토어 심사/비공개 테스트 기간 동안 매칭소/게임 기능을 노출에서 제외하기 위한 플래그.
// 테스트가 끝나고 정식 공개할 때 true로 되돌리면 됨.
export const MATCHING_ENABLED = false;
export const GAME_ENABLED = false;

// 💡 비공개 테스트 기간 동안 실제 광고 대신 Google 공식 테스트 광고 단위를 쓰기 위한 플래그.
// 테스트가 끝나고 정식 출시할 때 false로 되돌리면 됨.
export const USE_TEST_ADS = true;

// Google이 공식 제공하는 항상 안전한 테스트 광고 단위 ID (플랫폼별)
export const TEST_AD_IDS = {
  banner: { android: 'ca-app-pub-3940256099942544/6300978111', ios: 'ca-app-pub-3940256099942544/2934735716' },
  interstitial: { android: 'ca-app-pub-3940256099942544/1033173712', ios: 'ca-app-pub-3940256099942544/4411468910' },
  rewarded: { android: 'ca-app-pub-3940256099942544/5224354917', ios: 'ca-app-pub-3940256099942544/1712485313' },
};
