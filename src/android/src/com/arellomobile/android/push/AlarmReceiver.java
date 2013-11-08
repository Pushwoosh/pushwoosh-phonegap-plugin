package com.arellomobile.android.push;

import java.util.Calendar;

import com.google.android.gcm.GCMConstants;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

public class AlarmReceiver extends BroadcastReceiver {

	private static int counter = 0;
	private static final int MAX_ALARMS = 10;
	
    @Override
    public void onReceive(Context context, Intent intent)
    {
    	Intent msgIntent = new Intent(context, PushGCMIntentService.class);
    	msgIntent.setAction(GCMConstants.INTENT_FROM_GCM_MESSAGE);
    	msgIntent.putExtras(intent.getExtras());
    	context.startService(msgIntent);
    }
    
    //extras parameters:
    //title - message title, same as message parameter
    //l - link to open when notification has been tapped
    //b - banner URL to show in the notification instead of text
    //u - user data
    //i - identifier string of the image from the app to use as the icon in the notification
    //ci - URL of the icon to use in the notification
    static public void setAlarm(Context context, String message, Bundle extras, int seconds)
    {
    	// get a Calendar object with current time
    	Calendar cal = Calendar.getInstance();
    	// add 30 seconds to the calendar object
    	cal.add(Calendar.SECOND, seconds);
    	
    	Intent intent = new Intent(context, AlarmReceiver.class);
    	intent.putExtra("title", message);
    	intent.putExtra("local", true);
    	if(extras != null)
    	{
    		intent.putExtras(extras);
    	}
    	
    	PendingIntent sender = PendingIntent.getBroadcast(context, counter++, intent, PendingIntent.FLAG_UPDATE_CURRENT);
    	if(counter == MAX_ALARMS)
    		counter = 0;

    	// Get the AlarmManager service
    	AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    	am.set(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), sender);
    }

	public static void clearAlarm(Context context) {
		for(int i = 0; i < MAX_ALARMS; ++i) {
	    	Intent intent = new Intent(context, AlarmReceiver.class);
	    	PendingIntent sender = PendingIntent.getBroadcast(context, i, intent, PendingIntent.FLAG_UPDATE_CURRENT);
	
	    	// Get the AlarmManager service
	    	AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
	    	am.cancel(sender);
		}
	}
}
