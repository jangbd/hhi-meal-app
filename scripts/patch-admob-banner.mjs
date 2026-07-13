// 💡 @capacitor-community/admob 배너 관련 네이티브 패치 모음.
// node_modules는 git에 커밋되지 않으므로, npm install 이후 postinstall로 항상 재적용한다.
// 각 패치는 독립적으로 이미 적용됐는지 확인 후 없는 것만 적용한다 (하나가
// 이미 적용됐다고 나머지를 건너뛰면 안 됨 - 과거 버그).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const targetPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@capacitor-community',
  'admob',
  'android',
  'src',
  'main',
  'java',
  'com',
  'getcapacitor',
  'community',
  'admob',
  'banner',
  'BannerExecutor.java'
);

if (!fs.existsSync(targetPath)) {
  console.log('[patch-admob-banner] BannerExecutor.java not found, skipping (admob not installed?)');
  process.exit(0);
}

let content = fs.readFileSync(targetPath, 'utf8');
let appliedCount = 0;

// 패치 1: 애드뷰/레이아웃 투명 배경 처리
if (!content.includes('mAdView.setBackgroundColor(android.graphics.Color.TRANSPARENT)')) {
  content = content.replace(
    'mAdView = new AdView(contextSupplier.get());',
    [
      'mAdView = new AdView(contextSupplier.get());',
      '            // 💡 애드뷰 내부 WebView 기본 흰 배경이 광고 크리에이티브보다 큰 예약 영역에서',
      '            // 비치는 문제 방지를 위해 투명 처리 (앱 창 배경이 대신 비치도록)',
      '            mAdView.setBackgroundColor(android.graphics.Color.TRANSPARENT);',
    ].join('\n')
  );
  content = content.replace(
    'mAdViewLayout.setVerticalGravity(Gravity.BOTTOM);',
    'mAdViewLayout.setVerticalGravity(Gravity.BOTTOM);\n            mAdViewLayout.setBackgroundColor(android.graphics.Color.TRANSPARENT);'
  );
  appliedCount++;
  console.log('[patch-admob-banner] 패치 1/3 적용: 투명 배경');
}

// 패치 2: 어댑티브 배너 요청 폭을 448dp로 제한
if (content.includes('AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(contextSupplier.get(), (int) (defaultWidthPixels / density))')) {
  content = content.replace(
    'AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(contextSupplier.get(), (int) (defaultWidthPixels / density))',
    [
      'AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(',
      '                        contextSupplier.get(),',
      '                        Math.min((int) (defaultWidthPixels / density), 448)',
      '                    )',
    ].join('\n')
  );
  appliedCount++;
  console.log('[patch-admob-banner] 패치 2/3 적용: 어댑티브 배너 폭 448dp 제한');
}

// 패치 3: Android 15+ Safe Area 인셋 마진 처리 제거 (배너가 시스템 내비게이션 바
// 높이만큼 위로 밀려 올라가 화면 맨 아래와 배너 사이에 빈 공간이 생기는 원인이었음)
if (content.includes('// set Safe Area only for Android 15+')) {
  content = content.replace(
    /            \/\/ set Safe Area only for Android 15\+\n            if \(Build\.VERSION\.SDK_INT >= Build\.VERSION_CODES\.VANILLA_ICE_CREAM\) \{\n(?:.*\n)*?            \}\n\n            mAdViewLayout\.setLayoutParams\(mAdViewLayoutParams\);/,
    '            mAdViewLayout.setLayoutParams(mAdViewLayoutParams);'
  );
  appliedCount++;
  console.log('[patch-admob-banner] 패치 3/3 적용: Safe Area 인셋 마진 제거');
}

if (appliedCount > 0) {
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`[patch-admob-banner] 총 ${appliedCount}개 패치 적용 완료`);
} else {
  console.log('[patch-admob-banner] 이미 모두 적용됨');
}
