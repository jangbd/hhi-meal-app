package com.hhimeal.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LaunchAppPlugin.class);
        super.onCreate(savedInstanceState);

        // 💡 targetSdk 35+ 엣지투엣지 강제로 하단 내비게이션 바가 항상 투명해서
        // 그 뒤로 페이지 콘텐츠가 비쳐 보이는 문제. WebView 자체를 건드리면
        // 헤더 레이아웃이 깨지는 회귀가 있었으므로, 대신 내비게이션 바 영역
        // 크기에 딱 맞는 남색 사각형 뷰를 별도로 최상단에 얹어서 가린다.
        ViewGroup rootContent = findViewById(android.R.id.content);
        View navBarMask = new View(this);
        navBarMask.setBackgroundColor(Color.parseColor("#1a1a3c"));
        FrameLayout.LayoutParams maskParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            0
        );
        maskParams.gravity = Gravity.BOTTOM;
        rootContent.addView(navBarMask, maskParams);

        ViewCompat.setOnApplyWindowInsetsListener(rootContent, (v, insets) -> {
            int bottom = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
            maskParams.height = bottom;
            navBarMask.setLayoutParams(maskParams);
            return insets;
        });
    }
}
