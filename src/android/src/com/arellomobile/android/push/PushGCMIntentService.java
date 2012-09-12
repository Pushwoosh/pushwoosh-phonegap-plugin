//
//  MessageActivity.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed

package com.arellomobile.android.push;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import com.arellomobile.android.push.preference.SoundType;
import com.arellomobile.android.push.preference.VibrateType;
import com.arellomobile.android.push.utils.GeneralUtils;
import com.google.android.gcm.GCMBaseIntentService;

public class PushGCMIntentService extends GCMBaseIntentService
{
	@SuppressWarnings("hiding")
	private static final String TAG = "GCMIntentService";
	private static boolean mSimpleNotification = true;

	private Handler mHandler;

	public PushGCMIntentService()
	{
		String senderId = PushManager.mSenderId;
		Boolean simpleNotification = PushManager.sSimpleNotification;
		if (null != simpleNotification)
		{
			mSimpleNotification = simpleNotification;
		}
		if (null == senderId)
		{
			senderId = "";
		}
		mSenderId = senderId;
		mHandler = new Handler();
	}

	@Override
	protected void onRegistered(Context context, String registrationId)
	{
		Log.i(TAG, "Device registered: regId = " + registrationId);
		DeviceRegistrar.registerWithServer(context, registrationId);
	}

	@Override
	protected void onUnregistered(Context context, String registrationId)
	{
		Log.i(TAG, "Device unregistered");
		DeviceRegistrar.unregisterWithServer(context, registrationId);
	}

	@Override
	protected void onMessage(Context context, Intent intent)
	{
		Log.i(TAG, "Received message");
		// notifies user
		generateNotification(context, intent, mHandler);
	}

	@Override
	protected void onDeletedMessages(Context context, int total)
	{
		Log.i(TAG, "Received deleted messages notification");
	}

	@Override
	protected void onError(Context context, String errorId)
	{
		Log.e(TAG, "Messaging registration error: " + errorId);
		PushEventsTransmitter.onRegisterError(context, errorId);
	}

	@Override
	protected boolean onRecoverableError(Context context, String errorId)
	{
		// log message
		Log.i(TAG, "Received recoverable error: " + errorId);
		return super.onRecoverableError(context, errorId);
	}

	private static void generateNotification(Context context, Intent intent, Handler handler)
	{
		Bundle extras = intent.getExtras();
		if (extras == null)
		{
			return;
		}

		extras.putBoolean("foregroud", GeneralUtils.isAppOnForeground(context));

		String title = (String) extras.get("title");
		String link = (String) extras.get("l");

		// empty message with no data
		Intent notifyIntent;
		if (link != null)
		{
			// we want main app class to be launched
			notifyIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(link));
			notifyIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
		}
		else
		{
			notifyIntent = new Intent(context, PushHandlerActivity.class);
			notifyIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

			// pass all bundle
			notifyIntent.putExtra("pushBundle", extras);
		}

		NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

		// first string will appear on the status bar once when message is added
		CharSequence appName = context.getPackageManager().getApplicationLabel(context.getApplicationInfo());
		if (null == appName)
		{
			appName = "";
		}

		String newMessageString = ": new message";
		int resId = context.getResources().getIdentifier("new_push_message", "string", context.getPackageName());
		if (0 != resId)
		{
			newMessageString = context.getString(resId);
		}
		Notification notification = new Notification(context.getApplicationInfo().icon, appName + newMessageString,
				System.currentTimeMillis());

		// remove the notification from the status bar after it is selected
		notification.flags |= Notification.FLAG_AUTO_CANCEL;

		String sound = (String) extras.get("s");
		AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
		if (PushManager.sSoundType == SoundType.ALWAYS || (am.getRingerMode() == AudioManager.RINGER_MODE_NORMAL &&
				PushManager.sSoundType == SoundType.DEFAULT_MODE))
		{
			// if always or normal type set
			playPushNotificationSound(context, notification, sound);
		}
		if (PushManager.sVibrateType == VibrateType.ALWAYS || (am.getRingerMode() == AudioManager.RINGER_MODE_VIBRATE &&
				PushManager.sVibrateType == VibrateType.DEFAULT_MODE))
		{
			if (phoneHaveVibratePermission(context))
			{
				notification.defaults |= Notification.DEFAULT_VIBRATE;
			}
		}

		if (mSimpleNotification)
		{
			createSimpleNotification(context, notifyIntent, notification, appName, title, manager);
		}
		else
		{
			createMultyNotification(context, notifyIntent, notification, appName, title, manager);
		}
	}

	private static boolean phoneHaveVibratePermission(Context context)
	{
		PackageManager packageManager = context.getPackageManager();
		// check permission
		try
		{
			int result = packageManager.checkPermission(Manifest.permission.VIBRATE, context.getPackageName());
			if (result == PackageManager.PERMISSION_GRANTED)
			{
				return true;
			}
		}
		catch (Exception e)
		{
			Log.e("PushWoosh", "error in checking permission", e);
		}
		return false;
	}

	private static void createSimpleNotification(Context context, Intent notifyIntent, Notification notification,
			CharSequence appName, String title, NotificationManager manager)
	{
		PendingIntent contentIntent =
				PendingIntent.getActivity(context, 0, notifyIntent, PendingIntent.FLAG_CANCEL_CURRENT);

		// this will appear in the notifications list
		notification.setLatestEventInfo(context, appName, title, contentIntent);
		manager.notify(PushManager.MESSAGE_ID, notification);
	}

	private static void createMultyNotification(Context context, Intent notifyIntent, Notification notification,
			CharSequence appName, String title, NotificationManager manager)
	{
		PendingIntent contentIntent = PendingIntent
				.getActivity(context, PushManager.MESSAGE_ID, notifyIntent, PendingIntent.FLAG_UPDATE_CURRENT);

		// this will appear in the notifications list
		notification.setLatestEventInfo(context, appName, title, contentIntent);
		manager.notify(PushManager.MESSAGE_ID++, notification);
	}

	private static void playPushNotificationSound(Context context, Notification notification, String sound)
	{
		if (sound != null && sound.length() != 0)
		{
			int soundId = context.getResources().getIdentifier(sound, "raw", context.getPackageName());
			if (0 != soundId)
			{
				// if found valid resource id
				notification.sound = Uri.parse("android.resource://" + context.getPackageName() + "/" + soundId);
				return;
			}
		}

		// try to get default one
		notification.defaults |= Notification.DEFAULT_SOUND;
	}
}

