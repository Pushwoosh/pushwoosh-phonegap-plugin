package com.pushwoosh.plugin.pushnotifications.calls;

import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.pushwoosh.calls.PushwooshVoIPMessage;
import com.pushwoosh.calls.listener.CallEventListener;
import com.pushwoosh.plugin.pushnotifications.PushNotifications;

public class PWCordovaCallEventListener implements CallEventListener {
    private static final Object sCurrentCallLock = new Object();
    private static Bundle currentCallInfo = null;


    @Override
    public void onAnswer(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage, int i) {
        synchronized (sCurrentCallLock) {
            currentCallInfo = pushwooshVoIPMessage.getRawPayload();
        }
        PushwooshCallsAdapter.onAnswer(pushwooshVoIPMessage);
    }

    @Override
    public void onReject(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PushwooshCallsAdapter.onReject(pushwooshVoIPMessage);
        synchronized (sCurrentCallLock) {
            currentCallInfo = null;
        }
    }

    @Override
    public void onDisconnect(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PushwooshCallsAdapter.onDisconnect(pushwooshVoIPMessage);
        synchronized (sCurrentCallLock) {
            currentCallInfo = null;
        }
    }

    @Override
    public void onCreateIncomingConnection(@Nullable Bundle bundle) {
        synchronized (sCurrentCallLock) {
            currentCallInfo = bundle;
        }
        PushwooshCallsAdapter.onCreateIncomingConnection(bundle);
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
