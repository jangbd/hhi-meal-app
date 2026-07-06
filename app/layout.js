import './globals.css';
import Script from 'next/script'; // 💡 1. Next.js 스크립트 도구 불러오기 (필수)

export const metadata = {
  title: 'HHI 식단 앱',
  description: '현대일렉트릭 임직원 맞춤 서비스',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a3c" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        
        {/* 구글 애드센스 승인용 메타 태그 */}
        <meta name="google-adsense-account" content="ca-pub-1252871302557543" />

        {/* 💡 2. 외부 스크립트를 <Script> 컴포넌트로 변경 */}
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1252871302557543" 
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-slate-100 antialiased" style={{ fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif' }}>
        
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative pb-[65px]">
          {children}
          
          {/* --- 하단 고정 애드센스 광고 영역 --- */}
          {/* 💡 overflow-hidden 추가: 혹시라도 광고가 튀어나가는 것을 방지 */}
          <div className="fixed bottom-0 w-full max-w-md mx-auto h-[65px] bg-white border-t border-slate-200 z-50 flex items-center justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
            
            {/* 💡 3. 자동 크기 조절 속성 삭제 및 inline-block으로 고정 */}
            <ins className="adsbygoogle"
                 style={{ display: 'inline-block', width: '320px', height: '50px' }}
                 data-ad-client="ca-pub-1252871302557543"
                 data-ad-slot="6653115780"></ins>
            
            {/* 💡 4. 실행 스크립트도 <Script> 컴포넌트로 변경 */}
            <Script id="adsbygoogle-init" strategy="afterInteractive">
              {`(adsbygoogle = window.adsbygoogle || []).push({});`}
            </Script>

          </div>
        </div>
      </body>
    </html>
  );
}