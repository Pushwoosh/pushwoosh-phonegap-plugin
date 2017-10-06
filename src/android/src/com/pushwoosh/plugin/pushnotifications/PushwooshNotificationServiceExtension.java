package com.pushwoosh.plugin.pushnotifications;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;

import com.pushwoosh.internal.utils.PWLog;
import com.pushwoosh.notification.NotificationServiceExtension;
import com.pushwoosh.notification.PushMessage;

public class PushwooshNotificationServiceExtension extends NotificationServiceExtension
{

    private static final String TAG = "PushwooshNotificationServiceExtension";
    private static final String KEY_ACTION_PUSH_RECEIVED = TAG + "key_action_PUSH_RECEIVED";
    private static final String KEY_ACTION_PUSH_OPENED = TAG + "key_action_PUSH_OPENED";
    public static final String KEY_PUSH_JSON = TAG + "KEY_PUSH_JSON";
    private boolean showForegroundPush;

    public PushwooshNotificationServiceExtension() {
        try {
            String packageName = getApplicationContext().getPackageName();
            ApplicationInfo ai = getApplicationContext().getPackageManager().getApplicationInfo(packageName, PackageManager.GET_META_DATA);

            if (ai.metaData != null) {
                showForegroundPush = ai.metaData.getBoolean("PW_BROADCAST_PUSH", false) || ai.metaData.getBoolean("com.pushwoosh.foreground_push", false);
            }
        } catch (Exception e) {
            PWLog.error(PushNotifications.TAG, "Failed to read AndroidManifest metaData", e);
        }

        PWLog.debug(PushNotifications.TAG, "showForegroundPush = " + showForegroundPush);
    }

    @Override
    protected boolean onMessageReceived(final PushMessage pushMessage) {
        sendBrodcast(getPushReceivedAction(getApplicationContext()), pushMessage);
        return (!showForegroundPush && isAppOnForeground()) || super.onMessageReceived(pushMessage);
    }

    private void sendBrodcast(String action, final PushMessage pushMessage) {
        Intent intent = new Intent();
        intent.setAction(action);
        intent.putExtra(KEY_PUSH_JSON, pushMessage.toJson().toString());
        getApplicationContext().sendBroadcast(intent);
    }

    @Override
    protected void startActivityForPushMessage(final PushMessage pushMessage) {
        super.startActivityForPushMessage(pushMessage);
        onMessageOpened(pushMessage);
    }

    protected void onMessageOpened(PushMessage pushMessage){
        sendBrodcast(getPushOpenedAction(getApplicationContext()), pushMessage);
    }

    public static String getPushReceivedAction(Context context){
        return getAction(context, KEY_ACTION_PUSH_RECEIVED);
    }

    public static String getPushOpenedAction(Context context){
        return getAction(context, KEY_ACTION_PUSH_OPENED);
    }

    private static String getAction(Context context, String key){
        return context.getPackageName() + "." + key;
    }
}
