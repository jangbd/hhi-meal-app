package com.hhimeal.app;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LaunchApp")
public class LaunchAppPlugin extends Plugin {
    @PluginMethod
    public void launch(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null) {
            call.reject("packageName is required");
            return;
        }

        Intent launchIntent = getContext().getPackageManager().getLaunchIntentForPackage(packageName);
        JSObject ret = new JSObject();

        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(launchIntent);
            ret.put("launched", true);
        } else {
            // 설치되어 있지 않으면 Play 스토어로 안내
            try {
                Intent storeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
                storeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(storeIntent);
            } catch (Exception e) {
                Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + packageName));
                webIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(webIntent);
            }
            ret.put("launched", false);
        }

        call.resolve(ret);
    }
}
