package com.pushwoosh.plugin.pushnotifications.calls;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.pushwoosh.calls.PushwooshVoIPMessage;
import com.pushwoosh.calls.listener.CallEventListener;
import com.pushwoosh.internal.platform.AndroidPlatformModule;
import com.pushwoosh.internal.utils.PWLog;

public class PWCordovaCallEventListener implements CallEventListener {
    private static final Object sCurrentCallLock = new Object();
    private static Bundle currentCallInfo = null;


    @Override
    public void onAnswer(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage, int i) {
        synchronized (sCurrentCallLock) {
            currentCallInfo = pushwooshVoIPMessage.getRawPayload();
        }
        
        try {
            Context context = AndroidPlatformModule.getApplicationContext();
            Intent launchIntent = context != null ? context.getPackageManager().getLaunchIntentForPackage(context.getPackageName()) : null;

            if (launchIntent != null) {
                launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                context.startActivity(launchIntent);
                PWLog.info("PWCordovaCallEventListener", "Launched main activity for call");
            }
        } catch (Exception e) {
            PWLog.error("PWCordovaCallEventListener", "Failed to launch activity", e);
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

    @Override
    public void onCallCancelled(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PushwooshCallsAdapter.onCallCancelled(pushwooshVoIPMessage);
        synchronized (sCurrentCallLock) {
            currentCallInfo = null;
        }
    }

    @Override
    public void onCallCancellationFailed(@Nullable String callId, @Nullable String reason) {
        PushwooshCallsAdapter.onCallCancellationFailed(callId, reason);
    }

    public static Bundle getCurrentCallInfo() {
        synchronized (sCurrentCallLock) {
            return currentCallInfo;
        }
    }
}
