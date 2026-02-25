package com.pushwoosh.demovoip;

import android.os.Bundle;
import org.apache.cordova.CordovaActivity;

/**
 * A second CordovaActivity that loads second.html.
 *
 * When CordovaActivity initializes, it creates a new CordovaWebView which
 * re-instantiates ALL plugins — including PushNotifications. This overwrites
 * the static sInstance, cordovaInterface, and callbackContextMap in
 * PushNotifications.java, which is the root cause of the VoIP multi-WebView bug.
 */
public class SecondWebViewActivity extends CordovaActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        loadUrl("https://localhost/second.html");
    }
}
