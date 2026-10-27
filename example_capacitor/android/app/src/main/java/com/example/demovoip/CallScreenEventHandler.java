package com.example.demovoip;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.pushwoosh.calls.PushwooshVoIPMessage;
import com.pushwoosh.calls.listener.CallEventListener;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

/**
 * Demo handler plugged in through the {@code com.pushwoosh.cordova.CALL_EVENT_HANDLER}
 * meta-data. Forwards every call event to the call screen's page and raises the call
 * screen on answer instead of the plugin's default launch of the main activity.
 *
 * <p>The plugin still delivers the same events to the main page's JS; this handler only
 * adds delivery to a WebView the plugin does not know about.
 *
 * <p>The example assumes the call screen is already open (opened from the main page) when
 * the VoIP push arrives. Events that arrive while it is closed are only logged, and the
 * explicit raise then opens an empty call screen; after a cold start it becomes the root
 * of a new task without MainActivity under it.
 */
public class CallScreenEventHandler implements CallEventListener {

    private static final String TAG = "CallScreenEventHandler";

    @Override
    public void onCreateIncomingConnection(@Nullable Bundle payload) {
        dispatch("voipPushPayload", toJsPayload(new PushwooshVoIPMessage(payload)));
    }

    @Override
    public void onAnswer(@NonNull PushwooshVoIPMessage message, int videoState) {
        dispatch("answer", toJsPayload(message));
        Context context = DemoApplication.context();
        if (context == null) {
            Log.e(TAG, "no application context, call screen not raised");
            return;
        }
        raiseCallScreen(context, message);
    }

    @Override
    public void onReject(@NonNull PushwooshVoIPMessage message) {
        dispatch("reject", toJsPayload(message));
    }

    @Override
    public void onDisconnect(@NonNull PushwooshVoIPMessage message) {
        dispatch("hangup", toJsPayload(message));
    }

    @Override
    public void onCallAdded(@NonNull PushwooshVoIPMessage message) {
        dispatch("callAdded", toJsPayload(message));
    }

    @Override
    public void onCallRemoved(@NonNull PushwooshVoIPMessage message) {
        dispatch("callRemoved", toJsPayload(message));
    }

    @Override
    public void onCallCancelled(@NonNull PushwooshVoIPMessage message) {
        dispatch("voipDidCancelCall", toJsPayload(message));
    }

    @Override
    public void onCallCancellationFailed(@Nullable String callId, @NonNull String reason) {
        JSONObject payload = new JSONObject();
        try {
            payload.put("callId", callId != null ? callId : "").put("reason", reason);
        } catch (JSONException e) {
            Log.e(TAG, "failed to build cancellation payload", e);
        }
        dispatch("voipDidFailToCancelCall", payload);
    }

    enum RaiseStrategy { EXPLICIT, MOVE_TO_FRONT, LAUNCHER }

    static RaiseStrategy resolveStrategy(@Nullable Bundle rawPayload) {
        String value = rawPayload != null ? rawPayload.getString("strategy") : null;
        RaiseStrategy strategy;
        if ("moveToFront".equals(value)) {
            strategy = RaiseStrategy.MOVE_TO_FRONT;
        } else if ("launcher".equals(value)) {
            strategy = RaiseStrategy.LAUNCHER;
        } else {
            strategy = RaiseStrategy.EXPLICIT;
        }
        Log.i(TAG, "strategy=" + strategy + " raw=" + value);
        return strategy;
    }

    private static void raiseCallScreen(Context context, PushwooshVoIPMessage message) {
        switch (resolveStrategy(message.getRawPayload())) {
            case MOVE_TO_FRONT:
                raiseMoveToFront(context);
                break;
            case LAUNCHER:
                raiseLauncher(context);
                break;
            default:
                raiseExplicit(context);
        }
    }

    private static void raiseMoveToFront(Context context) {
        ActivityManager am = context.getSystemService(ActivityManager.class);
        ActivityManager.AppTask fallback = null;
        for (ActivityManager.AppTask task : am.getAppTasks()) {
            Intent base = task.getTaskInfo().baseIntent;
            String component = base.getComponent() != null ? base.getComponent().getClassName() : "";
            if (component.endsWith("IncomingCallActivity")) {
                continue;
            }
            if (base.hasCategory(Intent.CATEGORY_LAUNCHER)) {
                Log.i(TAG, "raise: moveToFront task #" + task.getTaskInfo().persistentId + " " + component);
                task.moveToFront();
                return;
            }
            if (fallback == null) {
                fallback = task;
            }
        }
        if (fallback == null) {
            Log.w(TAG, "raise: moveToFront found no own task");
            return;
        }
        Log.i(TAG, "raise: moveToFront task #" + fallback.getTaskInfo().persistentId + " (no LAUNCHER task)");
        fallback.moveToFront();
    }

    private static void raiseLauncher(Context context) {
        if (isProcessInForeground(context)) {
            Log.i(TAG, "raise: launcher skipped, process in foreground");
            return;
        }
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch == null) {
            Log.e(TAG, "raise: launcher has no launch intent");
            return;
        }
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        Log.i(TAG, "raise: launcher");
        context.startActivity(launch);
    }

    private static boolean isProcessInForeground(Context context) {
        ActivityManager am = context.getSystemService(ActivityManager.class);
        List<ActivityManager.RunningAppProcessInfo> processes = am.getRunningAppProcesses();
        if (processes == null) {
            return false;
        }
        for (ActivityManager.RunningAppProcessInfo process : processes) {
            if (process.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                    && process.processName.equals(context.getPackageName())) {
                return true;
            }
        }
        return false;
    }

    private static void raiseExplicit(Context context) {
        Log.i(TAG, "raise: explicit");
        Intent intent = new Intent(context, CallScreenActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        context.startActivity(intent);
    }

    private static void dispatch(String name, JSONObject payload) {
        CallScreenActivity screen = CallScreenActivity.current();
        if (screen == null) {
            Log.i(TAG, "call screen not alive, dropped " + name + " " + payload);
            return;
        }
        Log.i(TAG, "dispatch " + name + " -> CallScreen");
        screen.dispatch(name, payload);
    }

    private static JSONObject toJsPayload(PushwooshVoIPMessage message) {
        JSONObject payload = new JSONObject();
        Bundle raw = message.getRawPayload();
        try {
            payload.put("callerName", message.getCallerName())
                    .put("callId", message.getCallId())
                    .put("rawPayload", bundleToJson(raw))
                    .put("hasVideo", message.getHasVideo());
            if (raw != null && raw.containsKey("handleType")) {
                payload.put("handleType", raw.get("handleType"));
            }
        } catch (JSONException e) {
            Log.e(TAG, "failed to build event payload", e);
        }
        return payload;
    }

    private static JSONObject bundleToJson(@Nullable Bundle bundle) {
        JSONObject json = new JSONObject();
        if (bundle == null) {
            return json;
        }
        for (String key : bundle.keySet()) {
            Object value = bundle.get(key);
            try {
                json.put(key, value instanceof Bundle ? bundleToJson((Bundle) value) : JSONObject.wrap(value));
            } catch (JSONException e) {
                Log.w(TAG, "skipped rawPayload key " + key, e);
            }
        }
        return json;
    }
}
