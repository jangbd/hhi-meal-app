self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
});

// PWA 설치 조건을 충족하기 위한 필수 이벤트
self.addEventListener('fetch', (event) => {
  // 현재는 오프라인 캐싱 기능 없이 통과만 시킵니다.
});