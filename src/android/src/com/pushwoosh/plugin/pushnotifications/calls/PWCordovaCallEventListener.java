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
    
    private static final String TAG = "PWCordovaCallEventListener";
    private static final Object sCurrentCallLock = new Object();
    private static Bundle currentCallInfo = null;

    private void setCurrentCallInfo(Bundle bundle) {
        synchronized (sCurrentCallLock) {
            currentCallInfo = bundle;
        }
    }

    private void clearCurrentCallInfo() {
        synchronized (sCurrentCallLock) {
            currentCallInfo = null;
        }
    }

    public static Bundle getCurrentCallInfo() {
        synchronized (sCurrentCallLock) {
            return currentCallInfo;
        }
    }

    private void launchMainActivity() {
        PWLog.noise(TAG, "launchMainActivity()");
        try {
            Context context = AndroidPlatformModule.getApplicationContext();
            if (context == null) {
                PWLog.error(TAG, "cant launch activity: context is null");
                return;
            }
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launchIntent == null) {
                PWLog.error(TAG, "cant launch activity: launchIntent is null");
                return;
            }

            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(launchIntent);
        } catch (Exception e) {
            PWLog.error(TAG, "Failed to launch activity", e);
        }
    }


    @Override
    public void onCreateIncomingConnection(@Nullable Bundle bundle) {
        PWLog.noise(TAG, "onCreateIncomingConnection()");

        setCurrentCallInfo(bundle);
        PushwooshCallsAdapter.onCreateIncomingConnection(bundle);
    }


    @Override
    public void onAnswer(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage, int i) {
        PWLog.noise(TAG, "onAnswer()");

        setCurrentCallInfo(pushwooshVoIPMessage.getRawPayload());
        PushwooshCallsAdapter.onAnswer(pushwooshVoIPMessage);
        launchMainActivity();
    }

    @Override
    public void onReject(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PWLog.noise(TAG, "onReject()");

        PushwooshCallsAdapter.onReject(pushwooshVoIPMessage);
        clearCurrentCallInfo();
    }

    @Override
    public void onDisconnect(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PWLog.noise(TAG, "onDisconnect()");

        PushwooshCallsAdapter.onDisconnect(pushwooshVoIPMessage);
        clearCurrentCallInfo();
    }

    @Override
    public void onCallAdded(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PWLog.noise(TAG, "onCallAdded()");
        //stub
    }

    @Override
    public void onCallRemoved(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PWLog.noise(TAG, "onCallRemoved()");
        //stub
    }

    @Override
    public void onCallCancelled(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PWLog.noise(TAG, "onCallCancelled()");

        PushwooshCallsAdapter.onCallCancelled(pushwooshVoIPMessage);
        clearCurrentCallInfo();
    }

    @Override
    public void onCallCancellationFailed(@Nullable String callId, @Nullable String reason) {
        PWLog.noise(TAG, "onCallCancellationFailed()");

        PushwooshCallsAdapter.onCallCancellationFailed(callId, reason);
    }
}
