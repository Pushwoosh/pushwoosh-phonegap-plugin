package com.pushwoosh.plugin.pushnotifications;

import org.apache.cordova.CallbackContext;
import org.json.JSONArray;

public class NoopCallsAdapter implements CallsAdapter{
    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public boolean setVoipAppCode(JSONArray data, CallbackContext callbackContext) {
        return false;
    }

    @Override
    public boolean requestCallPermission(JSONArray data, CallbackContext callbackContext) {
        return false;
    }

    @Override
    public boolean registerEvent(JSONArray data, CallbackContext callbackContext) {
        return false;
    }

    @Override
    public boolean endCall(JSONArray data, CallbackContext callbackContext) {
        return false;
    }

    @Override
    public boolean initializeVoIPParameters(JSONArray data, CallbackContext callbackContext) {
        return false;
    }

    @Override
    public boolean mute() {
        return false;
    }

    @Override
    public boolean unmute() {
        return false;
    }

    @Override
    public boolean speakerOn() {
        return false;
    }

    @Override
    public boolean speakerOff() {
        return false;
    }
}
