// 💡 @capacitor-community/admob의 배너 뷰가 실제 광고 크리에이티브보다 큰
// 예약 영역에서 기본 흰 배경을 그대로 드러내는 문제를 막기 위한 패치.
// node_modules는 git에 커밋되지 않으므로, npm install 이후 postinstall로 항상 재적용한다.
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

if (content.includes('mAdView.setBackgroundColor(android.graphics.Color.TRANSPARENT)')) {
  console.log('[patch-admob-banner] already patched');
  process.exit(0);
}

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

fs.writeFileSync(targetPath, content, 'utf8');
console.log('[patch-admob-banner] patched BannerExecutor.java');
