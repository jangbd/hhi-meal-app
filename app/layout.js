import './globals.css';

export const metadata = {
  title: 'HHI 식단 앱',
  description: '현대일렉트릭 임직원 맞춤 서비스',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* 다른 태그들... */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        
        {/* 구글 애드센스 승인용 메타 태그 */}
        <meta name="google-adsense-account" content="ca-pub-1252871302557543"></meta>

        {/* 구글 애드센스 스크립트 */}
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1252871302557543" 
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="bg-slate-100 antialiased" style={{ fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif' }}>
        
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative pb-[65px]">
          {children}
          
          {/* --- 하단 고정 애드센스 광고 영역 --- */}
          <div className="fixed bottom-0 w-full max-w-md mx-auto h-[65px] bg-white border-t border-slate-200 z-50 flex items-center justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            
            {/* 제공해주신 코드 적용 */}
            <ins className="adsbygoogle"
                 style={{ display: 'block', width: '320px', height: '50px' }}
                 data-ad-client="ca-pub-1252871302557543"
                 data-ad-slot="6653115780"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            
            <script dangerouslySetInnerHTML={{ __html: "(adsbygoogle = window.adsbygoogle || []).push({});" }} />

          </div>
        </div>
      </body>
    </html>
  );
}