package com.pushwoosh.plugin.pushnotifications.calls;

import static com.pushwoosh.plugin.pushnotifications.PushNotifications.getCallbackContextMap;
import static com.pushwoosh.plugin.pushnotifications.PushNotifications.getCordovaInterface;

import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Bundle;

import com.pushwoosh.Pushwoosh;
import com.pushwoosh.calls.CallPermissionsCallback;
import com.pushwoosh.calls.PushwooshCallReceiver;
import com.pushwoosh.calls.PushwooshCallSettings;
import com.pushwoosh.calls.PushwooshVoIPMessage;
import com.pushwoosh.internal.platform.AndroidPlatformModule;
import com.pushwoosh.internal.utils.JsonUtils;
import com.pushwoosh.internal.utils.PWLog;
import com.pushwoosh.plugin.pushnotifications.CallsAdapter;
import com.pushwoosh.plugin.pushnotifications.PushNotifications;

import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;

public class PushwooshCallsAdapter implements CallsAdapter {
    public static final String TAG = "PushwooshCallsAdapter";

    @Override
    public boolean setVoipAppCode(JSONArray data, CallbackContext callbackContext) {
        PWLog.noise(TAG, "setVoipAppCode()");
        try {
            String appCode = data.getString(0);
            Pushwoosh.getInstance().addAlternativeAppCode(appCode);
        } catch (JSONException e) {
            PWLog.error(TAG, "No parameters passed (missing parameters)", e);
            return false;
        }
        return true;
    }

    @Override
    public boolean requestCallPermission(JSONArray data, final CallbackContext callbackContext) {
        PWLog.noise(TAG, "requestCallPermission()");
        try {
            PushwooshCallSettings.requestCallPermissions(new CallPermissionsCallback() {
                @Override
                public void onPermissionResult(boolean granted, java.util.List<String> grantedPerms, java.util.List<String> deniedPerms) {
                    callbackContext.success(granted ? 1 : 0);
                }
            });
        } catch (Exception e) {
            PWLog.error(TAG, "Failed to request call permissions: " + e.getMessage());
            callbackContext.error("Failed to request call permissions: " + e.getMessage());
            return false;
        }
        return true;
    }

    @Override
    public boolean getCallPermissionStatus(JSONArray data, CallbackContext callbackContext) {
        PWLog.noise(TAG, "getCallPermissionStatus()");
        try {
            int status = PushwooshCallSettings.getCallPermissionStatus();
            callbackContext.success(status);
            return true;
        } catch (Exception e) {
            PWLog.error(TAG, "Failed to get call permission status: " + e.getMessage());
            return false;
        }
    }

    @Override
    public boolean registerEvent(JSONArray data, CallbackContext callbackContext) {
        PWLog.noise(TAG, "registerEvent()");
        try {

            String eventType = data.getString(0);
            ArrayList<CallbackContext> callbackContextList = getCallbackContextMap().get(eventType);
            if (callbackContextList != null) {
                callbackContextList.add(callbackContext);
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean unregisterEvent(JSONArray data, CallbackContext callbackContext) {
        PWLog.noise(TAG, "unregisterEvent()");
        try {
            String eventType = data.getString(0);
            ArrayList<CallbackContext> callbackContextList = getCallbackContextMap().get(eventType);
            if (callbackContextList != null) {
                callbackContextList.clear();
                callbackContext.success("Successfully unregistered from " + eventType + " event");
            } else {
                callbackContext.error("Event " + eventType + " not found or not supported");
            }
            return true;
        } catch (Exception e) {
            PWLog.error(TAG, "Failed to unregister event: " + e.getMessage());
            return false;
        }
    }

    @Override
    public boolean endCall(JSONArray data, CallbackContext callbackContext) {
        PWLog.noise(TAG, "endCall()");
        Context context = AndroidPlatformModule.getApplicationContext();
        Intent endCallIntent = new Intent(context, PushwooshCallReceiver.class);
        endCallIntent.putExtras(PWCordovaCallEventListener.getCurrentCallInfo());
        endCallIntent.setAction("ACTION_END_CALL");
        getCordovaInterface().getActivity().getApplicationContext().sendBroadcast(endCallIntent);

        return true;
    }

    @Override
    public boolean initializeVoIPParameters(JSONArray data, CallbackContext callbackContext) {
        PWLog.noise(TAG, "initializeVoIPParameters()");
        try {
            String callSound = data.getString(1);
            if (callSound!= null && !callSound.isEmpty()){
                PushwooshCallSettings.setCallSound(callSound);
            }
            return true;
        }  catch (Exception e) {
            PWLog.error("Failed to fetch custom sound name");
            return false;
        }
    }

    @Override
    public boolean setIncomingCallTimeout(JSONArray data, CallbackContext callbackContext) {
        PWLog.noise(TAG, "setIncomingCallTimeout()");
        try {
            double timeout = data.getDouble(0);
            PushwooshCallSettings.setIncomingCallTimeout(timeout);
            return true;
        } catch (Exception e) {
            PWLog.error("Failed to set incoming call timeout: " + e.getMessage());
            return false;
        }
    }

    @Override
    public boolean mute() {
        PWLog.noise(TAG, "mute()");
        try {
            AudioManager audioManager = (AudioManager) getCordovaInterface().getActivity().getApplicationContext().getSystemService(Context.AUDIO_SERVICE);
            audioManager.setMicrophoneMute(true);
            return true;
        } catch (Exception e) {
            PWLog.error("Failed to mute audio channel");
            return false;
        }
    }

    @Override
    public boolean unmute() {
        PWLog.noise(TAG, "unmute()");
        try {
            AudioManager audioManager = (AudioManager) getCordovaInterface().getActivity().getApplicationContext().getSystemService(Context.AUDIO_SERVICE);
            audioManager.setMicrophoneMute(false);
            return true;
        } catch (Exception e) {
            PWLog.error("Failed to unmute audio channel");
            return false;
        }
    }

    @Override
    public boolean speakerOn() {
        PWLog.noise(TAG, "speakerOn()");
        try {
            AudioManager audioManager = (AudioManager) getCordovaInterface().getActivity().getApplicationContext().getSystemService(Context.AUDIO_SERVICE);
            audioManager.setSpeakerphoneOn(true);
            return true;
        } catch (Exception e) {
            PWLog.error("Failed to turn speaker on");
            return false;
        }
    }

    @Override
    public boolean speakerOff() {
        PWLog.noise(TAG, "speakerOff()");
        try {
            AudioManager audioManager = (AudioManager) getCordovaInterface().getActivity().getApplicationContext().getSystemService(Context.AUDIO_SERVICE);
            audioManager.setSpeakerphoneOn(false);
            return true;
        } catch (Exception e) {
            PWLog.error("Failed to turn speaker off");
            return false;
        }
    }

    public static void onAnswer(PushwooshVoIPMessage voIPMessage) {
        PWLog.noise(TAG, "onAnswer()");
        PushNotifications.emitVoipEvent("answer", parseVoIPMessage(voIPMessage));
    }

    public static void onReject(PushwooshVoIPMessage voIPMessage) {
        PWLog.noise(TAG, "onReject()");
        PushNotifications.emitVoipEvent("reject", parseVoIPMessage(voIPMessage));
    }

    public static void onDisconnect(PushwooshVoIPMessage voIPMessage) {
        PWLog.noise(TAG, "onDisconnect()");
        PushNotifications.emitVoipEvent("hangup", parseVoIPMessage(voIPMessage));
    }

    public static void onCreateIncomingConnection(Bundle bundle) {
        PWLog.noise(TAG, "onCreateIncomingConnection()");
        PushwooshVoIPMessage voipMessage = new PushwooshVoIPMessage(bundle);
        PushNotifications.emitVoipEvent("voipPushPayload", parseVoIPMessage(voipMessage));
    }

    public static void onCallCancelled(PushwooshVoIPMessage voIPMessage) {
        PWLog.noise(TAG, "onCallCancelled()");
        PushNotifications.emitVoipEvent("voipDidCancelCall", parseVoIPMessage(voIPMessage));
    }

    public static void onCallCancellationFailed(String callId, String reason) {
        PWLog.noise(TAG, "onCallCancellationFailed()");
        org.json.JSONObject payload = new org.json.JSONObject();
        try {
            payload.put("callId", callId != null ? callId : "");
            payload.put("reason", reason != null ? reason : "");
        } catch (org.json.JSONException ignored) {}
        PushNotifications.emitVoipEvent("voipDidFailToCancelCall", payload);
    }

    private static org.json.JSONObject parseVoIPMessage(PushwooshVoIPMessage message) {
        PWLog.noise(TAG, "parseVoIPMessage()");
        org.json.JSONObject payload = new org.json.JSONObject();
        try {
            Bundle rawBundle = message.getRawPayload();
            org.json.JSONObject rawPayloadJson = JsonUtils.bundleToJsonWithUserData(rawBundle);

            payload.put("callerName", message.getCallerName())
                    .put("callId", message.getCallId())
                    .put("rawPayload", rawPayloadJson)
                    .put("hasVideo", message.getHasVideo());

            if (rawBundle != null && rawBundle.containsKey("handleType")) {
                payload.put("handleType", rawBundle.get("handleType"));
            }
        } catch (org.json.JSONException ignored) {}
        return payload;
    }
}
