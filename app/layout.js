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
        
        {/* 💡 추후 애드센스 승인을 받으면 여기에 스크립트를 넣으시면 됩니다 */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous"></script> */}
      </head>
      <body className="bg-slate-100 antialiased" style={{ fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif' }}>
        
        {/* pb-[65px]를 추가하여 스크롤을 맨 아래로 내려도 콘텐츠가 하단 광고에 가려지지 않게 합니다 */}
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative pb-[65px]">
          {children}
          
          {/* --- 하단 고정 애드센스 광고 영역 --- */}
          <div className="fixed bottom-0 w-full max-w-md mx-auto h-[65px] bg-white border-t border-slate-200 z-50 flex items-center justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            
            {/* 현재는 개발 중이므로 가짜 배너(Placeholder)를 보여줍니다 */}
            <div className="w-[320px] h-[50px] bg-slate-100 text-slate-400 text-[11px] font-black flex items-center justify-center rounded border border-dashed border-slate-300">
              AD 배너 위치 (Google AdSense 320x50)
            </div>

            {/* 💡 실제 광고 코드를 발급받으면 위 가짜 배너 div를 지우고 아래 코드로 교체하세요!
              <ins className="adsbygoogle"
                   style={{ display: 'inline-block', width: '320px', height: '50px' }}
                   data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                   data-ad-slot="YYYYYYYYYY"></ins>
              <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
            */}
          </div>

        </div>
      </body>
    </html>
  );
}