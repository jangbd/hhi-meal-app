import './globals.css';

export const metadata = {
  title: 'HHI 식단 앱',
  description: '현대일렉트릭 임직원 맞춤 서비스',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* 고해상도 Pretendard 폰트 불러오기 */}
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        
        {/* 💡 구글 애드센스 승인용 메타 태그 */}
        <meta name="google-adsense-account" content="ca-pub-1252871302557543"></meta>

        {/* 💡 구글 애드센스 스크립트 (최상위 설정) */}
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1252871302557543" 
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="bg-slate-100 antialiased" style={{ fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif' }}>
        
        {/* 하단 광고 공간 확보를 위한 여백 */}
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative pb-[65px]">
          {children}
          
          {/* --- 하단 고정 애드센스 광고 영역 --- */}
          <div className="fixed bottom-0 w-full max-w-md mx-auto h-[65px] bg-white border-t border-slate-200 z-50 flex items-center justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            
            {/* 실제 광고 송출용 ins 태그 (승인 후 정상 작동) */}
            <ins className="adsbygoogle"
                 style={{ display: 'inline-block', width: '320px', height: '50px' }}
                 data-ad-client="ca-pub-1252871302557543"
                 data-ad-slot="YOUR_AD_SLOT_ID"></ins> {/* 💡 본인의 광고 슬롯 ID로 교체 필요 */}
            
            <script dangerouslySetInnerHTML={{ __html: "(adsbygoogle = window.adsbygoogle || []).push({});" }} />

          </div>
        </div>
      </body>
    </html>
  );
}