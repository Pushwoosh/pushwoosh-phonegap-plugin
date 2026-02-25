package com.pushwoosh.demovoip;

import android.app.ActivityManager;
import android.app.Application;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.pushwoosh.calls.PushwooshVoIPMessage;
import com.pushwoosh.calls.listener.CallEventListener;

/**
 * Example custom CallEventListener that demonstrates how to override
 * the default activity launch behavior in Cordova VoIP apps.
 *
 * <p>Instead of launching MainActivity (which destroys the back stack
 * with singleTask launch mode), this handler brings the existing task
 * to front preserving all activities in the back stack. Three strategies
 * are tried in order:
 * <ol>
 *   <li>{@link ActivityManager.AppTask#moveToFront()} — finds LAUNCHER task via getAppTasks()</li>
 *   <li>{@link ActivityManager#moveTaskToFront(int, int)} — finds task via getRunningTasks()
 *       (fallback for locked screen where getAppTasks() may not return the main task)</li>
 *   <li>startActivity() — last resort, may clear back stack with singleTask</li>
 * </ol>
 *
 * <p><b>Required permission</b> for Strategy 2 (locked screen):
 * {@code android.permission.REORDER_TASKS}
 *
 * <h3>Setup</h3>
 *
 * <p>Since Cordova requires Java sources to be part of a plugin, create a minimal
 * local plugin in your project:
 *
 * <pre>
 * my-call-handler/
 *   plugin.xml
 *   src/android/MyCallEventHandler.java
 * </pre>
 *
 * <p>{@code plugin.xml}:
 * <pre>{@code
 * <plugin id="my-call-handler" version="1.0.0"
 *         xmlns:android="http://schemas.android.com/apk/res/android">
 *     <platform name="android">
 *         <source-file src="src/android/MyCallEventHandler.java"
 *                      target-dir="src/com/example/app" />
 *         <config-file parent="/manifest/application" target="AndroidManifest.xml">
 *             <meta-data
 *                 android:name="com.pushwoosh.cordova.CALL_EVENT_HANDLER"
 *                 android:value="com.example.app.MyCallEventHandler" />
 *         </config-file>
 *         <config-file parent="/*" target="AndroidManifest.xml">
 *             <uses-permission android:name="android.permission.REORDER_TASKS" />
 *         </config-file>
 *     </platform>
 * </plugin>
 * }</pre>
 *
 * <p>Then install: {@code cordova plugin add ./my-call-handler}
 */
public class DemoCallEventHandler implements CallEventListener {

    private static final String TAG = "DemoCallEventHandler";

    @Nullable
    private Context getApplicationContext() {
        try {
            Application app = (Application) Class.forName("android.app.ActivityThread")
                    .getMethod("currentApplication")
                    .invoke(null);
            return app != null ? app.getApplicationContext() : null;
        } catch (Exception e) {
            Log.e(TAG, "Failed to get application context", e);
            return null;
        }
    }

    @SuppressWarnings("deprecation")
    private void bringAppToFront() {
        Log.d(TAG, "bringAppToFront()");
        try {
            Context context = getApplicationContext();
            if (context == null) {
                Log.e(TAG, "cant bring app to front: context is null");
                return;
            }

            ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            if (am == null) {
                Log.e(TAG, "ActivityManager is null");
                launchMainActivityFallback(context);
                return;
            }

            // --- Strategy 1: getAppTasks() ---
            List<ActivityManager.AppTask> appTasks = am.getAppTasks();
            if (appTasks != null && !appTasks.isEmpty()) {
                Log.d(TAG, "getAppTasks() returned " + appTasks.size() + " task(s)");
                ActivityManager.AppTask nonCallTask = null;

                for (ActivityManager.AppTask task : appTasks) {
                    ActivityManager.RecentTaskInfo taskInfo = task.getTaskInfo();
                    if (taskInfo == null) {
                        Log.d(TAG, "  task: taskInfo is null, skipping");
                        continue;
                    }
                    Intent baseIntent = taskInfo.baseIntent;
                    String component = baseIntent != null && baseIntent.getComponent() != null
                            ? baseIntent.getComponent().getClassName() : "null";
                    int taskId = taskInfo.persistentId;
                    Log.d(TAG, "  task #" + taskId + ": component=" + component
                            + ", categories=" + (baseIntent != null ? baseIntent.getCategories() : "null"));

                    // Primary: look for LAUNCHER task
                    if (baseIntent != null
                            && baseIntent.getCategories() != null
                            && baseIntent.getCategories().contains(Intent.CATEGORY_LAUNCHER)) {
                        Log.d(TAG, "Strategy 1a: Moving LAUNCHER task #" + taskId + " to front");
                        task.moveToFront();
                        return;
                    }

                    // Remember non-IncomingCallActivity task as secondary candidate
                    if (!component.contains("IncomingCallActivity")) {
                        nonCallTask = task;
                    }
                }

                // Secondary: try any non-IncomingCallActivity task
                if (nonCallTask != null) {
                    Log.d(TAG, "Strategy 1b: No LAUNCHER task, moving non-call task to front");
                    nonCallTask.moveToFront();
                    return;
                }

                Log.d(TAG, "No suitable task among " + appTasks.size() + " getAppTasks() result(s)");
            } else {
                Log.d(TAG, "getAppTasks() returned empty/null");
            }

            // --- Strategy 2: getRunningTasks() (deprecated but works for own app) ---
            try {
                List<ActivityManager.RunningTaskInfo> runningTasks = am.getRunningTasks(10);
                if (runningTasks != null && !runningTasks.isEmpty()) {
                    String packageName = context.getPackageName();
                    Log.d(TAG, "getRunningTasks() returned " + runningTasks.size() + " task(s)");

                    for (ActivityManager.RunningTaskInfo taskInfo : runningTasks) {
                        ComponentName base = taskInfo.baseActivity;
                        String className = base != null ? base.getClassName() : "null";
                        Log.d(TAG, "  running task #" + taskInfo.id + ": baseActivity=" + className
                                + ", numActivities=" + taskInfo.numActivities);

                        if (base != null
                                && base.getPackageName().equals(packageName)
                                && !className.contains("IncomingCallActivity")) {
                            Log.d(TAG, "Strategy 2: moveTaskToFront(#" + taskInfo.id + ")");
                            am.moveTaskToFront(taskInfo.id, ActivityManager.MOVE_TASK_WITH_HOME);
                            return;
                        }
                    }
                    Log.d(TAG, "No suitable running task for package " + packageName);
                } else {
                    Log.d(TAG, "getRunningTasks() returned empty/null");
                }
            } catch (Exception e) {
                Log.w(TAG, "getRunningTasks() fallback failed", e);
            }

            // --- Strategy 3: startActivity fallback ---
            launchMainActivityFallback(context);
        } catch (Exception e) {
            Log.e(TAG, "Failed to bring app to front", e);
        }
    }

    private void launchMainActivityFallback(Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent == null) {
            Log.e(TAG, "cant launch activity: launchIntent is null");
            return;
        }
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        Log.d(TAG, "Strategy 3 (fallback): launching main activity via startActivity()");
        context.startActivity(launchIntent);
    }

    @Override
    public void onAnswer(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage, int videoState) {
        Log.d(TAG, "onAnswer() — bringing app to front");
        bringAppToFront();
    }

    @Override
    public void onCreateIncomingConnection(@Nullable Bundle bundle) {
        // no-op: JS events are handled by PWCordovaCallEventListener
    }

    @Override
    public void onReject(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        // no-op
    }

    @Override
    public void onDisconnect(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        // no-op
    }

    @Override
    public void onCallAdded(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        // no-op
    }

    @Override
    public void onCallRemoved(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        // no-op
    }

    @Override
    public void onCallCancelled(@NonNull PushwooshVoIPMessage pushwooshVoIPMessage) {
        // no-op
    }

    @Override
    public void onCallCancellationFailed(@Nullable String callId, @Nullable String reason) {
        // no-op
    }
}
