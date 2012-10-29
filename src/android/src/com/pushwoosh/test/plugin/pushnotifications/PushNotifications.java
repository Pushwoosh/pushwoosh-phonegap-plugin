//
//  PushNotifications.java
//
// Pushwoosh, 01/07/12.
//
// Pushwoosh Push Notifications Plugin for Cordova Android
// www.pushwoosh.com
//
// MIT Licensed

package com.pushwoosh.test.plugin.pushnotifications;

import android.content.BroadcastReceiver;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;
import com.arellomobile.android.push.PushManager;
import com.arellomobile.android.push.BasePushMessageReceiver;
import com.arellomobile.android.push.exception.PushWooshException;
import com.google.android.gcm.GCMRegistrar;
import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.api.PluginResult.Status;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class PushNotifications extends Plugin
{
	public static final String REGISTER = "registerDevice";
	public static final String UNREGISTER = "unregisterDevice";
	public static final String SET_TAGS = "setTags";
	public static final String START_GEO_PUSHES = "startGeoPushes";
	public static final String STOP_GEO_PUSHES = "stopGeoPushes";

	HashMap<String, String> callbackIds = new HashMap<String, String>();
	PushManager mPushManager = null;

	/**
	 * Called when the activity receives a new intent.
	 */
	public void onNewIntent(Intent intent)
	{
		super.onNewIntent(intent);

		checkMessage(intent);
	}

	@Override
	public void onResume(boolean multitasking)
	{
		super.onResume(multitasking);

		IntentFilter intentFilter =
				new IntentFilter(cordova.getActivity().getPackageName() + ".action.PUSH_MESSAGE_RECEIVE");

		cordova.getActivity().registerReceiver(mReceiver, intentFilter);
	}

	@Override
	public void onPause(boolean multitasking)
	{
		super.onPause(multitasking);

		try
		{
			cordova.getActivity().unregisterReceiver(mReceiver);
		}
		catch (Exception e)
		{
			// pass. for some reason Phonegap call this method before onResume. Not Android lifecycle style...
		}
	}

	/**
	 * The final call you receive before your activity is destroyed.
	 */
	public void onDestroy()
	{
		super.onDestroy();
	}

	private PluginResult internalRegister(JSONArray data, String callbackId)
	{
		JSONObject params = null;
		try
		{
			params = data.getJSONObject(0);
		}
		catch (JSONException e)
		{
			e.printStackTrace();
			return new PluginResult(Status.ERROR);
		}

		try
		{
			mPushManager =
					new PushManager(cordova.getActivity(), params.getString("appid"), params.getString("projectid"));
		}
		catch (JSONException e)
		{
			e.printStackTrace();
			return new PluginResult(Status.ERROR);
		}

		try
		{
			mPushManager.onStartup(cordova.getActivity());
		}
		catch (java.lang.RuntimeException e)
		{
			e.printStackTrace();
			return new PluginResult(Status.ERROR);
		}

		checkMessage(cordova.getActivity().getIntent());

		callbackIds.put("registerDevice", callbackId);

		PluginResult result = new PluginResult(Status.NO_RESULT);
		result.setKeepCallback(true);
		return result;
	}

	private void checkMessage(Intent intent)
	{
		if (null != intent)
		{
			if (intent.hasExtra(PushManager.PUSH_RECEIVE_EVENT))
			{
				doOnMessageReceive(intent.getExtras().getString(PushManager.PUSH_RECEIVE_EVENT));
			}
			else if (intent.hasExtra(PushManager.REGISTER_EVENT))
			{
				doOnRegistered(intent.getExtras().getString(PushManager.REGISTER_EVENT));
			}
			else if (intent.hasExtra(PushManager.UNREGISTER_EVENT))
			{
				doOnUnregisteredError(intent.getExtras().getString(PushManager.UNREGISTER_EVENT));
			}
			else if (intent.hasExtra(PushManager.REGISTER_ERROR_EVENT))
			{
				doOnRegisteredError(intent.getExtras().getString(PushManager.REGISTER_ERROR_EVENT));
			}
			else if (intent.hasExtra(PushManager.UNREGISTER_ERROR_EVENT))
			{
				doOnUnregistered(intent.getExtras().getString(PushManager.UNREGISTER_ERROR_EVENT));
			}

			intent.putExtra(PushManager.PUSH_RECEIVE_EVENT, (String) null);
			intent.putExtra(PushManager.REGISTER_EVENT, (String) null);
			intent.putExtra(PushManager.UNREGISTER_EVENT, (String) null);
			intent.putExtra(PushManager.REGISTER_ERROR_EVENT, (String) null);
			intent.putExtra(PushManager.UNREGISTER_ERROR_EVENT, (String) null);

			cordova.getActivity().setIntent(intent);
		}
	}

	private PluginResult internalUnregister(JSONArray data, String callbackId)
	{
		callbackIds.put("unregisterDevice", callbackId);
		PluginResult result = new PluginResult(Status.NO_RESULT);
		result.setKeepCallback(true);

		try
		{
			GCMRegistrar.unregister(cordova.getActivity());
		}
		catch (Exception e)
		{
			return new PluginResult(Status.ERROR);
		}

		return result;
	}

	private PluginResult internalSendTags(JSONArray data, String callbackId)
	{
		if (mPushManager == null)
		{
			return new PluginResult(Status.ERROR);
		}

		JSONObject params;
		try
		{
			params = data.getJSONObject(0);
		}
		catch (JSONException e)
		{
			e.printStackTrace();
			return new PluginResult(Status.ERROR);
		}

		@SuppressWarnings("unchecked") Iterator<String> nameItr = params.keys();
		Map<String, Object> paramsMap = new HashMap<String, Object>();
		while (nameItr.hasNext())
		{
			try
			{
				String name = nameItr.next();
				paramsMap.put(name, params.get(name));
			}
			catch (JSONException e)
			{
				e.printStackTrace();
				return new PluginResult(Status.ERROR);
			}
		}

		try
		{
			Map<String, String> skippedTags = PushManager.sendTagsFromBG(cordova.getActivity(), paramsMap);

			JSONObject skippedTagsObj = new JSONObject();
			for (String tagName : skippedTags.keySet())
			{
				skippedTags.put(tagName, skippedTags.get(tagName));
			}

			return new PluginResult(Status.OK, skippedTagsObj);
		}
		catch (PushWooshException e)
		{
			e.printStackTrace();
			return new PluginResult(Status.ERROR);
		}
	}

	@Override
	public PluginResult execute(String action, JSONArray data, String callbackId)
	{
		Log.d("PushNotifications", "Plugin Called");

		if (REGISTER.equals(action))
		{
			return internalRegister(data, callbackId);
		}

		if (UNREGISTER.equals(action))
		{
			return internalUnregister(data, callbackId);
		}

		if (SET_TAGS.equals(action))
		{
			return internalSendTags(data, callbackId);
		}

		if (START_GEO_PUSHES.equals(action))
		{
			if (mPushManager == null)
			{
				return new PluginResult(Status.ERROR);
			}

			mPushManager.startTrackingGeoPushes();
			return new PluginResult(Status.OK);
		}

		if (STOP_GEO_PUSHES.equals(action))
		{
			if (mPushManager == null)
			{
				return new PluginResult(Status.ERROR);
			}

			mPushManager.stopTrackingGeoPushes();
			return new PluginResult(Status.OK);
		}

		Log.d("DirectoryListPlugin", "Invalid action : " + action + " passed");
		return new PluginResult(Status.INVALID_ACTION);
	}

	private void doOnRegistered(String registrationId)
	{
		String callbackId = callbackIds.get("registerDevice");
		PluginResult result = new PluginResult(Status.OK, registrationId);
		success(result, callbackId);
		callbackIds.remove(callbackId);
	}

	private void doOnRegisteredError(String errorId)
	{
		String callbackId = callbackIds.get("registerDevice");
		PluginResult result = new PluginResult(Status.ERROR, errorId);
		error(result, callbackId);
		callbackIds.remove(callbackId);
	}

	private void doOnUnregistered(String registrationId)
	{
		String callbackId = callbackIds.get("unregisterDevice");
		PluginResult result = new PluginResult(Status.OK, registrationId);
		success(result, callbackId);
		callbackIds.remove(callbackId);
	}

	private void doOnUnregisteredError(String errorId)
	{
		String callbackId = callbackIds.get("unregisterDevice");
		PluginResult result = new PluginResult(Status.ERROR, errorId);
		error(result, callbackId);
		callbackIds.remove(callbackId);
	}

	private void doOnMessageReceive(String message)
	{
		String jsStatement = String.format("window.plugins.pushNotification.notificationCallback(%s);", message);
		sendJavascript(jsStatement);
	}


	private BroadcastReceiver mReceiver = new BasePushMessageReceiver()
	{
		@Override
		protected void onMessageReceive(String data)
		{
			doOnMessageReceive(data);
		}
	};
}
