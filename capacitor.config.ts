import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hhimeal.app',
  appName: 'HD현대 식단 앱',
  webDir: 'public',
  // 💡 iOS 하단 홈 인디케이터(제스처 바) 영역처럼 웹 콘텐츠가 닿지 않는 네이티브
  // 여백이 기본 흰색 대신 앱 브랜드 색(theme-color와 동일)으로 채워지도록 설정.
  backgroundColor: '#1a1a3c',
  server: {
    url: 'https://www.hhimeal.com',
    cleartext: false
  }
};

export default config;
