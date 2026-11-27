package com.pushwoosh.plugin.pushnotifications;

import com.pushwoosh.internal.utils.PWLog;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;

public class NoopCallsAdapter implements CallsAdapter{
    private static final String TAG = "NoopCallsAdapter";

    @Override
    public boolean requestCallPermission(JSONArray data, CallbackContext callbackContext) {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean getCallPermissionStatus(JSONArray data, CallbackContext callbackContext) {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean registerEvent(JSONArray data, CallbackContext callbackContext, CordovaPlugin owner) {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean unregisterEvent(JSONArray data, CallbackContext callbackContext, CordovaPlugin owner) {
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
    public boolean setIncomingCallTimeout(JSONArray data, CallbackContext callbackContext) {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean setRingtone(JSONArray data, CallbackContext callbackContext) {
        PWLog.error(TAG,"Method not implemented");
        return false;
    }

    @Override
    public boolean mute(JSONArray data, CallbackContext callbackContext) {
        return voipNotEnabled(callbackContext);
    }

    @Override
    public boolean unmute(JSONArray data, CallbackContext callbackContext) {
        return voipNotEnabled(callbackContext);
    }

    @Override
    public boolean speakerOn(JSONArray data, CallbackContext callbackContext) {
        return voipNotEnabled(callbackContext);
    }

    @Override
    public boolean speakerOff(JSONArray data, CallbackContext callbackContext) {
        return voipNotEnabled(callbackContext);
    }

    private static boolean voipNotEnabled(CallbackContext callbackContext) {
        PWLog.error(TAG, "VoIP is not enabled");
        callbackContext.error("VoIP is not enabled");
        return true;
    }
}
