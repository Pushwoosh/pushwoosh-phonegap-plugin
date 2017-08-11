package com.pushwoosh.plugin.pushnotifications;

import com.pushwoosh.Pushwoosh;
import com.pushwoosh.function.Callback;

public class PushwooshDelegate {

	public static void unregisterForPushNotifications(Callback<String, UnregisterForPushNotificationException> callback) {
		Pushwoosh.getInstance().unregisterForPushNotifications();
	}
}
