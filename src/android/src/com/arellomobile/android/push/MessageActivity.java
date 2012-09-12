//
//  MessageActivity.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed

package com.arellomobile.android.push;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;

import java.util.logging.Logger;

public class MessageActivity extends Activity
{
	private static final String MESSAGE_HANDLER_KEY = ".MESSAGE";

	@Override
	public void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);

		startPushMessageHandlerActivity();

		finish();
	}

	private void startPushMessageHandlerActivity()
	{
		Intent notifyIntent = new Intent();
		String intentAction = getApplicationContext().getPackageName() + MESSAGE_HANDLER_KEY;
		notifyIntent.setAction(intentAction);
		notifyIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
		notifyIntent.putExtras(getIntent().getExtras());
		try
		{
			startActivity(notifyIntent);
		}
		catch (ActivityNotFoundException e)
		{
			Logger.getLogger(getClass().getSimpleName())
					.severe("Can't launch activity. Are you sure you have an activity with '" + intentAction +
							"' action in your manifest?");
		}
	}
}
