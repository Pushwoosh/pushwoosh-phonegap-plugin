package com.arellomobile.android.push;

import com.arellomobile.android.push.utils.PreferenceUtils;

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
	public static final String JSON_DATA_KEY = "pw_data_json_string";

	@Override
	public void onReceive(Context context, Intent intent)
	{
		NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

		manager.cancel(PreferenceUtils.getMessageId(context));

		PushManager pushManager = new PushManager(context);
		pushManager.sendPushStat(context, intent.getExtras().getString("p"));
		onMessageReceive(intent);
	}

	protected abstract void onMessageReceive(Intent intent);
}
