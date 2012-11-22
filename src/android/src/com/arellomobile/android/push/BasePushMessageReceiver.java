package com.arellomobile.android.push;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Date: 15.10.12
 * Time: 16:40
 *
 * @author MiG35
 */
public abstract class BasePushMessageReceiver extends BroadcastReceiver
{
	public static final String DATA_KEY = "data";

	@Override
	public void onReceive(Context context, Intent intent)
	{
		NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

		manager.cancel(PushManager.MESSAGE_ID);

		PushManager pushManager = new PushManager(context);
		pushManager.sendPushStat(context, intent.getExtras().getString("p"));
		onMessageReceive(intent.getStringExtra(DATA_KEY));
	}

	protected abstract void onMessageReceive(String data);
}
