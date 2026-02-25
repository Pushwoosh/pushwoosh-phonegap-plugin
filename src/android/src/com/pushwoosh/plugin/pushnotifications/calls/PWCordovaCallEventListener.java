package com.pushwoosh.plugin.pushnotifications.calls;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.pushwoosh.calls.PushwooshVoIPMessage;
import com.pushwoosh.calls.listener.CallEventListener;
import com.pushwoosh.internal.platform.AndroidPlatformModule;
import com.pushwoosh.internal.utils.PWLog;

/**
 * Cordova bridge implementation of {@link CallEventListener}.
 *
 * <p>Always forwards VoIP events to JavaScript via {@link PushwooshCallsAdapter}.
 * Optionally delegates to a custom handler specified in AndroidManifest.xml.
 *
 * <p>If no custom handler is set, {@code onAnswer} launches the main activity as default behavior.
 *
 * <p><b>Custom handler setup</b> (in Cordova app's {@code config.xml}):
 * <pre>{@code
 * <platform name="android">
 *     <config-file parent="/manifest/application" target="AndroidManifest.xml">
 *         <meta-data
 *             android:name="com.pushwoosh.cordova.CALL_EVENT_HANDLER"
 *             android:value="com.example.MyCallEventListener" />
 *     </config-file>
 * </platform>
 * }</pre>
 */
public class PWCordovaCallEventListener implements CallEventListener {

    private static final String TAG = "PWCordovaCallEventListener";
    private static final String CUSTOM_HANDLER_META_KEY = "com.pushwoosh.cordova.CALL_EVENT_HANDLER";
    private static final Object sCurrentCallLock = new Object();
    private static Bundle currentCallInfo = null;

    private volatile boolean handlerResolved;
    private volatile CallEventListener customHandler;

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

    @Nullable
    private CallEventListener getCustomHandler() {
        if (!handlerResolved) {
            synchronized (this) {
                if (!handlerResolved) {
                    customHandler = resolveCustomHandler();
                    handlerResolved = true;
                }
            }
        }
        return customHandler;
    }

    @Nullable
    private CallEventListener resolveCustomHandler() {
        try {
            Context context = AndroidPlatformModule.getApplicationContext();
            if (context == null) {
                PWLog.error(TAG, "Failed to resolve custom handler: context is null");
                return null;
            }

            ApplicationInfo appInfo = context.getPackageManager()
                    .getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
            Bundle meta = appInfo.metaData;
            if (meta == null) {
                return null;
            }

            String className = meta.getString(CUSTOM_HANDLER_META_KEY);
            if (className == null || className.isEmpty()) {
                return null;
            }

            Class<?> clazz = Class.forName(className);
            CallEventListener handler = (CallEventListener) clazz.getConstructor().newInstance();
            PWLog.info(TAG, "Custom CallEventHandler resolved: " + className);
            return handler;
        } catch (ClassNotFoundException e) {
            PWLog.error(TAG, "Custom handler class not found (check ProGuard rules): " + e.getMessage());
            return null;
        } catch (NoSuchMethodException e) {
            PWLog.error(TAG, "Custom handler missing default constructor: " + e.getMessage());
            return null;
        } catch (Exception e) {
            PWLog.error(TAG, "Failed to resolve custom CallEventHandler", e);
            return null;
        }
    }

    private static boolean isAppInForeground(Context context) {
        ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        if (activityManager == null) {
            PWLog.noise(TAG, "isAppInForeground: false (activityManager is null)");
            return false;
        }

        List<ActivityManager.RunningAppProcessInfo> appProcesses = activityManager.getRunningAppProcesses();
        if (appProcesses == null) {
            PWLog.noise(TAG, "isAppInForeground: false (appProcesses is null)");
            return false;
        }

        String packageName = context.getPackageName();
        for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
            if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                    && appProcess.processName.equals(packageName)) {
                PWLog.noise(TAG, "isAppInForeground: true (process=" + appProcess.processName + ", importance=FOREGROUND)");
                return true;
            }
        }
        PWLog.noise(TAG, "isAppInForeground: false (no foreground process found for " + packageName + ")");
        return false;
    }

    private void launchMainActivity() {
        PWLog.noise(TAG, "launchMainActivity()");
        try {
            Context context = AndroidPlatformModule.getApplicationContext();
            if (context == null) {
                PWLog.error(TAG, "cant launch activity: context is null");
                return;
            }

            if (isAppInForeground(context)) {
                PWLog.noise(TAG, "App already in foreground, skipping activity launch");
                return;
            }

            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launchIntent == null) {
                PWLog.error(TAG, "cant launch activity: launchIntent is null");
                return;
            }

            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PWLog.noise(TAG, "Launching activity with flags: FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_SINGLE_TOP, intent: " + launchIntent.toString());
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

        CallEventListener handler = getCustomHandler();
        if (handler != null) {
            try {
                handler.onCreateIncomingConnection(bundle);
            } catch (Exception e) {
                PWLog.error(TAG, "Custom handler onCreateIncomingConnection() threw exception", e);
            }
        }
    }


    @Override
    public void onAnswer(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage, int i) {
        PWLog.noise(TAG, "onAnswer()");

        setCurrentCallInfo(pushwooshVoIPMessage.getRawPayload());
        PushwooshCallsAdapter.onAnswer(pushwooshVoIPMessage);

        CallEventListener handler = getCustomHandler();
        if (handler != null) {
            try {
                handler.onAnswer(pushwooshVoIPMessage, i);
            } catch (Exception e) {
                PWLog.error(TAG, "Custom handler onAnswer() threw exception", e);
            }
        } else {
            launchMainActivity();
        }
    }

    @Override
    public void onReject(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PWLog.noise(TAG, "onReject()");

        PushwooshCallsAdapter.onReject(pushwooshVoIPMessage);
        clearCurrentCallInfo();

        CallEventListener handler = getCustomHandler();
        if (handler != null) {
            try {
                handler.onReject(pushwooshVoIPMessage);
            } catch (Exception e) {
                PWLog.error(TAG, "Custom handler onReject() threw exception", e);
            }
        }
    }

    @Override
    public void onDisconnect(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PWLog.noise(TAG, "onDisconnect()");

        PushwooshCallsAdapter.onDisconnect(pushwooshVoIPMessage);
        clearCurrentCallInfo();

        CallEventListener handler = getCustomHandler();
        if (handler != null) {
            try {
                handler.onDisconnect(pushwooshVoIPMessage);
            } catch (Exception e) {
                PWLog.error(TAG, "Custom handler onDisconnect() threw exception", e);
            }
        }
    }

    @Override
    public void onCallAdded(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PWLog.noise(TAG, "onCallAdded()");

        CallEventListener handler = getCustomHandler();
        if (handler != null) {
            try {
                handler.onCallAdded(pushwooshVoIPMessage);
            } catch (Exception e) {
                PWLog.error(TAG, "Custom handler onCallAdded() threw exception", e);
            }
        }
    }

    @Override
    public void onCallRemoved(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PWLog.noise(TAG, "onCallRemoved()");

        CallEventListener handler = getCustomHandler();
        if (handler != null) {
            try {
                handler.onCallRemoved(pushwooshVoIPMessage);
            } catch (Exception e) {
                PWLog.error(TAG, "Custom handler onCallRemoved() threw exception", e);
            }
        }
    }

    @Override
    public void onCallCancelled(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        PWLog.noise(TAG, "onCallCancelled()");

        PushwooshCallsAdapter.onCallCancelled(pushwooshVoIPMessage);
        clearCurrentCallInfo();

        CallEventListener handler = getCustomHandler();
        if (handler != null) {
            try {
                handler.onCallCancelled(pushwooshVoIPMessage);
            } catch (Exception e) {
                PWLog.error(TAG, "Custom handler onCallCancelled() threw exception", e);
            }
        }
    }

    @Override
    public void onCallCancellationFailed(@Nullable String callId, @Nullable String reason) {
        PWLog.noise(TAG, "onCallCancellationFailed()");

        PushwooshCallsAdapter.onCallCancellationFailed(callId, reason);

        CallEventListener handler = getCustomHandler();
        if (handler != null) {
            try {
                handler.onCallCancellationFailed(callId, reason);
            } catch (Exception e) {
                PWLog.error(TAG, "Custom handler onCallCancellationFailed() threw exception", e);
            }
        }
    }
}
