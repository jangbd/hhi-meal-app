import './globals.css';
import Script from 'next/script';

// 💡 1. 순수 메타데이터 (Next.js 최신 규격)
export const metadata = {
  title: 'HHI 식단 앱',
  description: '현대일렉트릭 임직원 맞춤 서비스',
};

// 💡 2. 뷰포트 설정 분리 (Vercel 빌드 경고 해결)
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
        {/* --- PWA(바로가기 설치) 및 아이콘 설정 --- */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* 아이폰용 아이콘 (public/apple-touch-icon.png) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* 안드로이드용 아이콘 (public/icons/icon-192x192.png) */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HHI 식단 앱" />
        <meta name="theme-color" content="#1a1a3c" />

        {/* 폰트 및 애드센스 설정 */}
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
        
        {/* 전체 컨테이너: h-[100dvh]로 화면 꽉 채우고 이중 스크롤 방지 */}
        <div className="max-w-md mx-auto h-[100dvh] flex flex-col bg-white shadow-2xl relative overflow-hidden">
          
          {/* 메인 컨텐츠 영역: 스크롤은 여기서만 발생 */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          
          {/* 하단 고정 광고바 */}
          <footer className="flex-none w-full max-w-md h-[65px] bg-white border-t border-slate-200 z-50 flex items-center justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
            <ins className="adsbygoogle"
                 style={{ display: 'inline-block', width: '320px', height: '50px' }}
                 data-ad-client="ca-pub-1252871302557543"
                 data-ad-slot="6653115780"></ins>
            
            <Script id="adsbygoogle-init" strategy="afterInteractive">
              {`
                try {
                  (adsbygoogle = window.adsbygoogle || []).push({});
                } catch (e) {
                  console.error('AdSense error:', e);
                }
              `}
            </Script>
          </footer>
          
        </div>
      </body>
    </html>
  );
}