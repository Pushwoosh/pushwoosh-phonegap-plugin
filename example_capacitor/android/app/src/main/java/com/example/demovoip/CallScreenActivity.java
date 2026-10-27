package com.example.demovoip;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONObject;

/**
 * Call screen of the demo: a plain (non-Capacitor) WebView in a second activity on top of
 * MainActivity, in the same task. Events reach its page through
 * {@code window.__pushwooshDispatch(name, payload)}, the same convention as on iOS.
 */
public class CallScreenActivity extends AppCompatActivity {

    private static final String TAG = "CallScreen";
    private static volatile CallScreenActivity current;

    private WebView webView;

    @Nullable
    public static CallScreenActivity current() {
        return current;
    }

    public void dispatch(String name, JSONObject payload) {
        String quotedName = JSONObject.quote(name);
        String js = "if (typeof window.__pushwooshDispatch === 'function') {"
                + " window.__pushwooshDispatch(" + quotedName + "," + payload + ");"
                + " } else { console.log('dispatch before page ready: ' + " + quotedName + "); }";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage message) {
                Log.i("CallScreenPage", message.message());
                return true;
            }
        });
        setContentView(webView);
        webView.loadUrl("file:///android_asset/public/call.html");
        current = this;
        Log.i(TAG, "onCreate " + hash() + " task=" + getTaskId());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Log.i(TAG, "onNewIntent " + hash());
    }

    @Override
    protected void onDestroy() {
        Log.i(TAG, "onDestroy " + hash());
        if (current == this) {
            current = null;
        }
        webView.destroy();
        super.onDestroy();
    }

    private String hash() {
        return Integer.toHexString(System.identityHashCode(this));
    }
}
