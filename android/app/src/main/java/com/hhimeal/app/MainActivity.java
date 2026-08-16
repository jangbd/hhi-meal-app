package com.hhimeal.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LaunchAppPlugin.class);
        super.onCreate(savedInstanceState);
        // 💡 targetSdk 36(Android 16)부터 엣지투엣지가 강제되면서, 화면 하단에
        // 떠 있는 AdMob 네이티브 배너가 시스템 내비게이션 바 영역까지 침범해서
        // 내비게이션 버튼과 겹쳐 보이는 문제가 생김. 기존처럼 시스템 바 영역을
        // 앱이 침범하지 않도록 되돌려서 배너가 그 영역을 피해 정상 위치에 뜨게 함.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
