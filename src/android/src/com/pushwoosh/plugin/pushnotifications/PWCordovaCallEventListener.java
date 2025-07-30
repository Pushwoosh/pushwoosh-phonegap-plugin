package com.pushwoosh.plugin.pushnotifications;

import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.pushwoosh.calls.PushwooshVoIPMessage;
import com.pushwoosh.calls.listener.CallEventListener;

public class PWCordovaCallEventListener implements CallEventListener {
    private static final Object sCurrentCallLock = new Object();
    private static Bundle currentCallInfo = null;


    @Override
    public void onAnswer(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage, int i) {
        synchronized (sCurrentCallLock) {
            currentCallInfo = pushwooshVoIPMessage.getRawPayload();
        }
        PushNotifications.onAnswer(pushwooshVoIPMessage);
    }

    @Override
    public void onReject(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PushNotifications.onReject(pushwooshVoIPMessage);
        synchronized (sCurrentCallLock) {
            currentCallInfo = null;
        }
    }

    @Override
    public void onDisconnect(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PushNotifications.onDisconnect(pushwooshVoIPMessage);
        synchronized (sCurrentCallLock) {
            currentCallInfo = null;
        }
    }

    @Override
    public void onCreateIncomingConnection(@Nullable Bundle bundle) {
        synchronized (sCurrentCallLock) {
            currentCallInfo = bundle;
        }
        PushNotifications.onCreateIncomingConnection(bundle);
    }

    @Override
    public void onCallAdded(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        //stub
    }

    @Override
    public void onCallRemoved(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        //stub
    }

    public static Bundle getCurrentCallInfo() {
        synchronized (sCurrentCallLock) {
            return currentCallInfo;
        }
    }
}
