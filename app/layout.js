import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'HHI 식단 앱',
  description: '현대일렉트릭 임직원 맞춤 서비스',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* 아이폰용 아이콘 (public 최상단 파일 사용) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* 안드로이드용 아이콘 (public/icons 폴더 사용) */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        
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
        <div className="max-w-md mx-auto h-[100dvh] flex flex-col bg-white shadow-2xl relative overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <footer className="flex-none w-full max-w-md h-[65px] bg-white border-t border-slate-200 z-50 flex items-center justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
            <ins className="adsbygoogle"
                 style={{ display: 'inline-block', width: '320px', height: '50px' }}
                 data-ad-client="ca-pub-1252871302557543"
                 data-ad-slot="6653115780"></ins>
            <Script id="adsbygoogle-init" strategy="afterInteractive">
              {`try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.error(e); }`}
            </Script>
          </footer>
        </div>
      </body>
    </html>
  );
}