//
//  GeneralUtils.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed

package com.arellomobile.android.push.utils;

import android.app.ActivityManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.provider.Settings;
import android.telephony.TelephonyManager;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Date: 16.08.12
 * Time: 21:01
 *
 * @author mig35
 */
public class GeneralUtils
{
	private static final String SHARED_KEY = "deviceid";
	private static final String SHARED_PREF_NAME = "com.arellomobile.android.push.deviceid";

	private static List<String> sWrongAndroidDevices;

	static
	{
		sWrongAndroidDevices = new ArrayList<String>();

		sWrongAndroidDevices.add("9774d56d682e549c");
	}

	public static String getDeviceUUID(Context context)
	{
		final String androidId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
		// see http://code.google.com/p/android/issues/detail?id=10603
		if (null != androidId && !sWrongAndroidDevices.contains(androidId))
		{
			return androidId;
		}
		try
		{
			final String deviceId =
					((TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE)).getDeviceId();
			if (null != deviceId)
			{
				return deviceId;
			}
		}
		catch (RuntimeException e)
		{
			// if no
		}
		SharedPreferences sharedPreferences =
				context.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_WORLD_WRITEABLE);
		// try to get from pref
		String deviceId = sharedPreferences.getString(SHARED_KEY, null);
		if (null != deviceId)
		{
			return deviceId;
		}
		// generate new
		deviceId = UUID.randomUUID().toString();
		SharedPreferences.Editor editor = sharedPreferences.edit();
		// and save it
		editor.putString(SHARED_KEY, deviceId);
		editor.commit();
		return deviceId;
	}

	public static boolean isTablet(Context context)
	{
		// TODO: This hacky stuff goes away when we allow users to target devices
		int xlargeBit = 4; // Configuration.SCREENLAYOUT_SIZE_XLARGE;  // upgrade to HC SDK to get this
		Configuration config = context.getResources().getConfiguration();
		return (config.screenLayout & xlargeBit) == xlargeBit;
	}

	public static void checkNotNullOrEmpty(String reference, String name)
	{
		checkNotNull(reference, name);
		if (reference.length() == 0)
		{
			throw new IllegalArgumentException(
					String.format("Please set the %1$s constant and recompile the app.", name));
		}
	}

	public static void checkNotNull(Object reference, String name)
	{
		if (reference == null)
		{
			throw new IllegalArgumentException(
					String.format("Please set the %1$s constant and recompile the app.", name));
		}
	}

	public static boolean isAppOnForeground(Context context)
	{
		ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
		List<ActivityManager.RunningAppProcessInfo> appProcesses = activityManager.getRunningAppProcesses();
		if (appProcesses == null)
		{
			return false;
		}

		final String packageName = context.getPackageName();
		for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses)
		{
			if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND && appProcess
					.processName.equals(packageName))
			{
				return true;
			}
		}

		return false;
	}

	public static boolean checkStickyBroadcastPermissions(Context context)
	{
		return context.getPackageManager().checkPermission("android.permission.BROADCAST_STICKY", context.getPackageName()) ==
				PackageManager.PERMISSION_GRANTED;
	}

}
