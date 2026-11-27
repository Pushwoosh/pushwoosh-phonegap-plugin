package com.pushwoosh.plugin.pushnotifications;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;

public interface CallsAdapter {
    public boolean requestCallPermission(JSONArray data, final CallbackContext callbackContext);
    public boolean getCallPermissionStatus(JSONArray data, final CallbackContext callbackContext);
    public boolean registerEvent(JSONArray data, final CallbackContext callbackContext, CordovaPlugin owner);
    public boolean unregisterEvent(JSONArray data, final CallbackContext callbackContext, CordovaPlugin owner);
    public boolean endCall(JSONArray data, final CallbackContext callbackContext);
    public boolean initializeVoIPParameters(JSONArray data, final CallbackContext callbackContext);
    public boolean setIncomingCallTimeout(JSONArray data, final CallbackContext callbackContext);
    public boolean setRingtone(JSONArray data, final CallbackContext callbackContext);
    public boolean mute(JSONArray data, final CallbackContext callbackContext);
    public boolean unmute(JSONArray data, final CallbackContext callbackContext);
    public boolean speakerOn(JSONArray data, final CallbackContext callbackContext);
    public boolean speakerOff(JSONArray data, final CallbackContext callbackContext);
    }
