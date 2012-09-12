//
//  MessageActivity.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed

package com.arellomobile.android.push.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class PreferenceUtils
{
	private static final String PREFERENCE = "com.google.android.c2dm";

	private static final String LAST_REGISTRATION = "last_registration_change";

	public static String getSenderId(Context context)
	{
		final SharedPreferences prefs = context.getSharedPreferences(PREFERENCE, Context.MODE_PRIVATE);
		return prefs.getString("dm_sender_id", "");
	}

	public static void setSenderId(Context context, String senderId)
	{
		final SharedPreferences prefs = context.getSharedPreferences(PREFERENCE, Context.MODE_PRIVATE);
		final SharedPreferences.Editor editor = prefs.edit();
		editor.putString("dm_sender_id", senderId);
		editor.commit();
	}

	public static long getLastRegistration(Context context)
	{
		final SharedPreferences prefs = context.getSharedPreferences(PREFERENCE, Context.MODE_PRIVATE);
		return prefs.getLong(LAST_REGISTRATION, 0);
	}

	public static void setLastRegistration(Context context, long lastRegistrationTime)
	{
		final SharedPreferences.Editor editor = context.getSharedPreferences(PREFERENCE, Context.MODE_PRIVATE).edit();
		editor.putLong(LAST_REGISTRATION, lastRegistrationTime);
		editor.commit();
	}

	public static void resetLastRegistration(Context context)
	{
		final SharedPreferences.Editor editor = context.getSharedPreferences(PREFERENCE, Context.MODE_PRIVATE).edit();
		editor.remove(LAST_REGISTRATION);
		editor.commit();
	}

	public static void setApplicationId(Context context, String applicationId)
	{
		final SharedPreferences prefs = context.getSharedPreferences(PREFERENCE, Context.MODE_PRIVATE);
		SharedPreferences.Editor editor = prefs.edit();
		editor.putString("dm_pwapp", applicationId);
		editor.commit();
	}

	public static String getApplicationId(Context context)
	{
		final SharedPreferences prefs = context.getSharedPreferences(PREFERENCE, Context.MODE_PRIVATE);
		String applicationId = prefs.getString("dm_pwapp", "");
		return applicationId;
	}
}
