package com.arellomobile.android.push.utils.notification;

import android.Manifest;
import android.app.Notification;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import com.arellomobile.android.push.preference.SoundType;
import com.arellomobile.android.push.preference.VibrateType;

/**
 * Date: 28.09.12
 * Time: 12:08
 *
 * @author MiG35
 */
public class NotificationFactory
{

	public static Notification generateNotification(Context context, Bundle data, CharSequence appName,
			SoundType soundType, VibrateType vibrateType)
	{
		String newMessageString = ": new message";
		int resId = context.getResources().getIdentifier("new_push_message", "string", context.getPackageName());
		if (0 != resId)
		{
			newMessageString = context.getString(resId);
		}

		Notification notification;

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB)
		{
			notification = V11NotificationCreator.generateNotification(context, data, appName + newMessageString);
		}
		else
		{
			notification = NotificationCreator.generateNotification(context, data, appName + newMessageString);
		}

		// remove the notification from the status bar after it is selected
		notification.flags |= Notification.FLAG_AUTO_CANCEL;

		String sound = (String) data.get("s");
		AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
		if (soundType == SoundType.ALWAYS ||
				(am.getRingerMode() == AudioManager.RINGER_MODE_NORMAL && soundType == SoundType.DEFAULT_MODE))
		{
			// if always or normal type set
			playPushNotificationSound(context, notification, sound);
		}
		if (vibrateType == VibrateType.ALWAYS ||
				(am.getRingerMode() == AudioManager.RINGER_MODE_VIBRATE && vibrateType == VibrateType.DEFAULT_MODE))
		{
			if (phoneHaveVibratePermission(context))
			{
				notification.defaults |= Notification.DEFAULT_VIBRATE;
			}
		}

		return notification;
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
}
