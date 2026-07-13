import './globals.css';
import Script from 'next/script';
import AdMobBanner from './AdMobBanner';
import WebAdFooter from './WebAdFooter';

export const metadata = {
  title: 'HHI 식단 앱',
  description: '현대일렉트릭 임직원 맞춤 서비스',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/apple-touch-icon.png" />
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HHI 식단 앱" />
        <meta name="theme-color" content="#1a1a3c" />

        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <meta name="google-adsense-account" content="ca-pub-1252871302557543" />
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1252871302557543" 
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className="bg-slate-100 antialiased" style={{ fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif' }}>
        
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function() {
                  console.log('SW registered');
                });
              });
            }
          `}
        </Script>

        {/* 💡 식단/버스 페이지 오류 해결: 강제 높이 제한(h-[100dvh])을 풀고 자연스럽게 스크롤 되도록 복구했습니다! */}
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative pb-[95px]">
          {children}

          {/* 하단 광고 배너: 네이티브 앱은 AdMob 네이티브 배너, 웹은 기존 AdSense 배너 */}
          <AdMobBanner />
          <WebAdFooter />
        </div>
      </body>
    </html>
  );
}