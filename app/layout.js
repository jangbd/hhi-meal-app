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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1a1a3c" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

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
        
        {/* 💡 이중 스크롤 원인 제거: flex 제한을 풀고 하단 패딩(pb-[65px])을 주어 자연스럽게 스크롤되도록 복구 */}
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative pb-[65px]">
          
          {children}
          
          {/* 💡 하단 광고바: 화면 맨 아래 무조건 고정(fixed) */}
          <footer className="fixed bottom-0 w-full max-w-md mx-auto h-[65px] bg-white border-t border-slate-200 z-[100] flex items-center justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
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