package com.pushwoosh.plugin.pushnotifications.calls;

import static com.pushwoosh.plugin.pushnotifications.PushNotifications.getCallbackContextMap;
import static com.pushwoosh.plugin.pushnotifications.PushNotifications.getCordovaInterface;

import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Bundle;

import com.pushwoosh.Pushwoosh;
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
    public boolean requestCallPermission(JSONArray data, CallbackContext callbackContext) {
        try {
            PushwooshCallSettings.requestCallPermissions();
        } catch (Exception e) {
            PWLog.error(TAG, "Failed to request call permissions: " + e.getMessage());
            return false;
        }
        return true;
    }

    @Override
    public boolean registerEvent(JSONArray data, CallbackContext callbackContext) {
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
    public boolean endCall(JSONArray data, CallbackContext callbackContext) {
        Context context = AndroidPlatformModule.getApplicationContext();
        Intent endCallIntent = new Intent(context, PushwooshCallReceiver.class);
        endCallIntent.putExtras(PWCordovaCallEventListener.getCurrentCallInfo());
        endCallIntent.setAction("ACTION_END_CALL");
        getCordovaInterface().getActivity().getApplicationContext().sendBroadcast(endCallIntent);

        return true;
    }

    @Override
    public boolean initializeVoIPParameters(JSONArray data, CallbackContext callbackContext) {
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
    public boolean mute() {
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
        PushNotifications.emitVoipEvent("answer", parseVoIPMessage(voIPMessage));
    }

    public static void onReject(PushwooshVoIPMessage voIPMessage) {
        PushNotifications.emitVoipEvent("reject", parseVoIPMessage(voIPMessage));
    }

    public static void onDisconnect(PushwooshVoIPMessage voIPMessage) {
        PushNotifications.emitVoipEvent("hangup", parseVoIPMessage(voIPMessage));
    }

    public static void onCreateIncomingConnection(Bundle bundle) {
        PushNotifications.emitVoipEvent("voipPushPayload", JsonUtils.bundleToJson(bundle));
    }

    private static org.json.JSONObject parseVoIPMessage(PushwooshVoIPMessage message) {
        org.json.JSONObject payload = new org.json.JSONObject();
        try {
            payload.put("callerName", message.getCallerName())
                    .put("rawPayload", message.getRawPayload())
                    .put("hasVideo", message.getHasVideo());
        } catch (org.json.JSONException ignored) {}
        return payload;
    }
}
