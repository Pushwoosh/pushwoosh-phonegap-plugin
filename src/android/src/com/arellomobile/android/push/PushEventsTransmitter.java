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

public class PushEventsTransmitter
{
    private static void transmit(final Context context, String stringToShow, String messageKey)
    {
        Intent notifyIntent = new Intent(context, MessageActivity.class);
        notifyIntent.putExtra(messageKey, stringToShow);
        notifyIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(notifyIntent);
    }

    static void onRegistered(final Context context, String registrationId)
    {
        String alertString = "Registered. RegistrationId is " + registrationId;
        transmit(context, registrationId, PushManager.REGISTER_EVENT);
    }

    static void onRegisterError(final Context context, String errorId)
    {
        String alertString = "Register error. Error message is " + errorId;
        transmit(context, errorId, PushManager.REGISTER_ERROR_EVENT);
    }

    static void onUnregistered(final Context context, String registrationId)
    {
        String alertString = "Unregistered. RegistrationId is " + registrationId;
        transmit(context, registrationId, PushManager.UNREGISTER_EVENT);
    }

    static void onUnregisteredError(Context context, String errorId)
    {
        transmit(context, errorId, PushManager.UNREGISTER_ERROR_EVENT);
    }

    static void onMessageReceive(final Context context, String message)
    {
        transmit(context, message, PushManager.PUSH_RECEIVE_EVENT);
    }
}
