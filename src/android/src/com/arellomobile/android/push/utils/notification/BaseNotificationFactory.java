package com.arellomobile.android.push.utils.notification;

import android.Manifest;
import android.app.Notification;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import com.arellomobile.android.push.preference.SoundType;
import com.arellomobile.android.push.preference.VibrateType;

/**
 * Date: 30.10.12
 * Time: 20:06
 *
 * @author MiG35
 */
public abstract class BaseNotificationFactory
{
	private Notification mNotification;

	private Context mContext;
	private Bundle mData;
	private String mHeader;
	private String mMessage;
	private SoundType mSoundType;
	private VibrateType mVibrateType;

	public BaseNotificationFactory(Context context, Bundle data, String header, String message, SoundType soundType, VibrateType vibrateType)
	{
		mContext = context;
		mData = data;
		mHeader = header;
		mMessage = message;
		mSoundType = soundType;
		mVibrateType = vibrateType;
	}
	
	public void generateNotification()
	{
		int resId = getContext().getResources().getIdentifier("new_push_message", "string", getContext().getPackageName());
		if (0 != resId)
		{
			String newMessageString = getContext().getString(resId);
			mNotification = generateNotificationInner(getContext(), getData(), mHeader, mMessage, newMessageString);
			return;
		}

		mNotification = generateNotificationInner(getContext(), getData(), mHeader, mMessage, mMessage);
	}
	
	abstract Notification generateNotificationInner(Context context, Bundle data, String header, String message, String tickerTitle);
	
	public void addLED(boolean enable)
	{
		if(!enable)
			return;
		
		//by some reason doesn't work on Galaxy Nexus
		//mNotification.defaults |= Notification.DEFAULT_LIGHTS;
		
		mNotification.ledARGB = 0xFFFFFFFF;
		mNotification.flags |= Notification.FLAG_SHOW_LIGHTS;
		mNotification.ledOnMS = 100; 
		mNotification.ledOffMS = 1000;
	}

	public void addSoundAndVibrate()
	{
		String sound = (String) mData.get("s");
		AudioManager am = (AudioManager) mContext.getSystemService(Context.AUDIO_SERVICE);
		if (mSoundType == SoundType.ALWAYS || (am.getRingerMode() == AudioManager.RINGER_MODE_NORMAL && mSoundType == SoundType.DEFAULT_MODE))
		{
			// if always or normal type set
			addPushNotificationSound(mContext, mNotification, sound);
		}
		if (mVibrateType == VibrateType.ALWAYS || (am.getRingerMode() == AudioManager.RINGER_MODE_VIBRATE && mVibrateType == VibrateType.DEFAULT_MODE))
		{
			if (phoneHaveVibratePermission(mContext))
			{
				mNotification.defaults |= Notification.DEFAULT_VIBRATE;
			}
		}
	}

	public void addCancel()
	{
		mNotification.flags |= Notification.FLAG_AUTO_CANCEL;
	}

	public Notification getNotification()
	{
		return mNotification;
	}

	private static void addPushNotificationSound(Context context, Notification notification, String sound)
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
			Log.e("PushWoosh", "error in checking vibrate permission", e);
		}
		return false;
	}

	protected Context getContext()
	{
		return mContext;
	}

	protected Bundle getData()
	{
		return mData;
	}

	protected SoundType getSoundType()
	{
		return mSoundType;
	}

	protected VibrateType getVibrateType()
	{
		return mVibrateType;
	}
}
