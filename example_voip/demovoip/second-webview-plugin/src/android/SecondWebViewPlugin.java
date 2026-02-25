package com.pushwoosh.demovoip;

import android.content.Intent;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;

public class SecondWebViewPlugin extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        if ("open".equals(action)) {
            Intent intent = new Intent(cordova.getActivity(), SecondWebViewActivity.class);
            cordova.getActivity().startActivity(intent);
            callbackContext.success("Second WebView opened");
            return true;
        } else if ("close".equals(action)) {
            // Finish the current activity if it's a SecondWebViewActivity
            if (cordova.getActivity() instanceof SecondWebViewActivity) {
                cordova.getActivity().finish();
            }
            callbackContext.success("Second WebView closed");
            return true;
        }
        return false;
    }
}
