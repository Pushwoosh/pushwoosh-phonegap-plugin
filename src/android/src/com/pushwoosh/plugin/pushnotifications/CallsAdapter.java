package com.pushwoosh.plugin.pushnotifications;

import org.apache.cordova.CallbackContext;
import org.json.JSONArray;

public interface CallsAdapter {
    public boolean setVoipAppCode(JSONArray data, CallbackContext callbackContext);
    public boolean requestCallPermission(JSONArray data, final CallbackContext callbackContext);
    public boolean getCallPermissionStatus(JSONArray data, final CallbackContext callbackContext);
    public boolean registerEvent(JSONArray data, final CallbackContext callbackContext);
    public boolean unregisterEvent(JSONArray data, final CallbackContext callbackContext);
    public boolean endCall(JSONArray data, final CallbackContext callbackContext);
    public boolean initializeVoIPParameters(JSONArray data, final CallbackContext callbackContext);
    public boolean mute();
    public boolean unmute();
    public boolean speakerOn();
    public boolean speakerOff();
    }
