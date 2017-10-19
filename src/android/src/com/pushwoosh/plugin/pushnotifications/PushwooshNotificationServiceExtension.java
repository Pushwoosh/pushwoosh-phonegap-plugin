package com.pushwoosh.plugin.pushnotifications;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;

import com.pushwoosh.internal.utils.PWLog;
import com.pushwoosh.notification.NotificationServiceExtension;
import com.pushwoosh.notification.PushMessage;

public class PushwooshNotificationServiceExtension extends NotificationServiceExtension {
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
		PushNotifications.messageReceived(pushMessage.toJson().toString());
		return (!showForegroundPush && isAppOnForeground()) || super.onMessageReceived(pushMessage);
	}

	@Override
	protected void onMessageOpened(PushMessage pushMessage) {
		PushNotifications.openPush(pushMessage.toJson().toString());
	}
}
