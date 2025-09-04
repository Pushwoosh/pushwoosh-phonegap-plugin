package com.pushwoosh.plugin.pushnotifications;

import com.pushwoosh.internal.utils.PWLog;

import org.apache.cordova.CallbackContext;
import org.json.JSONArray;

public class NoopCallsAdapter implements CallsAdapter{
    private static final String TAG = "NoopCallsAdapter";
    @Override
    public boolean setVoipAppCode(JSONArray data, CallbackContext callbackContext) {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean requestCallPermission(JSONArray data, CallbackContext callbackContext) {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean registerEvent(JSONArray data, CallbackContext callbackContext) {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean endCall(JSONArray data, CallbackContext callbackContext) {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean initializeVoIPParameters(JSONArray data, CallbackContext callbackContext) {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean mute() {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean unmute() {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean speakerOn() {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean speakerOff() {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }
}
