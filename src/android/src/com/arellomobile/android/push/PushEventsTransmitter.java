//
//  PushEventsTransmitter.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed

package com.arellomobile.android.push;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import com.arellomobile.android.push.utils.GeneralUtils;

public class PushEventsTransmitter
{
	private static boolean getUseBroadcast(Context context)
	{
        ApplicationInfo ai = null;
        try {
            ai = context.getPackageManager().getApplicationInfo(context.getApplicationContext().getPackageName(), PackageManager.GET_META_DATA);
            Bundle metaData = ai.metaData;
            if(metaData != null)
            {
            	boolean useBroadcast = ai.metaData.getBoolean("PW_BROADCAST_REGISTRATION", true);
            	System.out.println("Using broadcast registration: " + useBroadcast);
            	return useBroadcast;
            }
            
            return true;
            
        } catch (Exception e) {
            e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
            return true;
        }
	}
	
    private static void transmit(final Context context, String stringToShow, String messageKey)
    {
    	transmit(context, stringToShow, messageKey, null);
    }

    private static void transmit(final Context context, String stringToShow, String messageKey, Bundle pushBundle)
    {
        Intent notifyIntent = new Intent(context, MessageActivity.class);
        
        if(pushBundle != null)
        	notifyIntent.putExtras(pushBundle);
        
        notifyIntent.putExtra(messageKey, stringToShow);
        notifyIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(notifyIntent);
    }

	static void onRegistered(final Context context, String registrationId)
	{
		if(getUseBroadcast(context))
		{
			//String alertString = "Registered. RegistrationId is " + registrationId;
			transmitBroadcast(context, registrationId, PushManager.REGISTER_EVENT);
		}
		else
		{
			transmit(context, registrationId, PushManager.REGISTER_EVENT);
		}
	}

	static void onRegisterError(final Context context, String errorId)
	{
		if(getUseBroadcast(context))
		{
			//String alertString = "Register error. Error message is " + errorId;
			transmitBroadcast(context, errorId, PushManager.REGISTER_ERROR_EVENT);
		}
		else
		{
			transmit(context, errorId, PushManager.REGISTER_ERROR_EVENT);
		}
	}

	private static void transmitBroadcast(Context context, String registrationId, String registerEvent)
	{
		String packageName = context.getPackageName();
		Intent intent = new Intent(packageName + "." + PushManager.REGISTER_BROAD_CAST_ACTION);
		intent.putExtra(registerEvent, registrationId);
		intent.setPackage(packageName);

		if (GeneralUtils.checkStickyBroadcastPermissions(context))
		{
			context.sendStickyBroadcast(intent);
		}
		else
		{
			Log.w(PushEventsTransmitter.class.getSimpleName(), "No android.permission.BROADCAST_STICKY. Reverting to simple broadcast");
			context.sendBroadcast(intent);
		}
	}

    static void onUnregistered(final Context context, String registrationId)
    {
		if(getUseBroadcast(context))
		{
	        //String alertString = "Unregistered. RegistrationId is " + registrationId;
			transmitBroadcast(context, registrationId, PushManager.UNREGISTER_EVENT);
		}
		else
		{
			transmit(context, registrationId, PushManager.UNREGISTER_EVENT);
		}
    }

    static void onUnregisteredError(Context context, String errorId)
    {
		if(getUseBroadcast(context))
		{
			transmitBroadcast(context, errorId, PushManager.UNREGISTER_ERROR_EVENT);
		}
		else
		{
	        transmit(context, errorId, PushManager.UNREGISTER_ERROR_EVENT);
		}
    }

    static void onMessageReceive(final Context context, String message)
    {
    	onMessageReceive(context, message, null);
    }
    
    static void onMessageReceive(final Context context, String message, Bundle pushBundle)
    {
        transmit(context, message, PushManager.PUSH_RECEIVE_EVENT, pushBundle);
    }
}
