//
//  PushNotifications.java
//
// Pushwoosh, 01/07/12.
//
// Pushwoosh Push Notifications Plugin for Cordova Android
// www.pushwoosh.com
//
// MIT Licensed

package com.pushwoosh.plugin.pushnotifications;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.location.Location;
import android.os.Bundle;
import android.util.Log;

import com.arellomobile.android.push.BasePushMessageReceiver;
import com.arellomobile.android.push.PushManager;
import com.arellomobile.android.push.PushPersistance;
import com.arellomobile.android.push.PushManager.GetTagsListener;
import com.arellomobile.android.push.SendPushTagsCallBack;
import com.arellomobile.android.push.preference.SoundType;
import com.arellomobile.android.push.preference.VibrateType;
import com.arellomobile.android.push.utils.RegisterBroadcastReceiver;
import com.google.android.gcm.GCMRegistrar;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class PushNotifications extends CordovaPlugin
{
	public static final String REGISTER = "registerDevice";
	public static final String UNREGISTER = "unregisterDevice";
	public static final String SET_TAGS = "setTags";
	public static final String START_GEO_PUSHES = "startGeoPushes";
	public static final String START_LOCATION_TRACKING = "startLocationTracking";
	public static final String STOP_GEO_PUSHES = "stopGeoPushes";
	public static final String STOP_LOCATION_TRACKING = "stopLocationTracking";
	public static final String START_BEACON_PUSHES = "startBeaconPushes";
	public static final String STOP_BEACON_PUSHES = "stopBeaconPushes";
	public static final String SET_BEACON_BACKGROUND_MODE = "setBeaconBackgroundMode";
	public static final String SEND_LOCATION = "sendLocation";
	public static final String CREATE_LOCAL_NOTIFICATION = "createLocalNotification";
	public static final String CLEAR_LOCAL_NOTIFICATION = "clearLocalNotification";
	public static final String GET_TAGS = "getTags";
	public static final String ON_DEVICE_READY = "onDeviceReady";
	public static final String GET_PUSH_TOKEN = "getPushToken";
	public static final String GET_HWID = "getPushwooshHWID";

	boolean receiversRegistered = false;
	boolean deviceReady = false;

	HashMap<String, CallbackContext> callbackIds = new HashMap<String, CallbackContext>();
	PushManager mPushManager = null;

	/**
	 * Called when the activity receives a new intent.
	 */
	public void onNewIntent(Intent intent)
	{
		super.onNewIntent(intent);

		checkMessage(intent);
	}

	BroadcastReceiver mBroadcastReceiver = new RegisterBroadcastReceiver()
	{
		@Override
		public void onRegisterActionReceive(Context context, Intent intent)
		{
			checkMessage(intent);
		}
	};

	//Registration of the receivers
	public void registerReceivers()
	{
		if (receiversRegistered)
			return;

		IntentFilter intentFilter = new IntentFilter(cordova.getActivity().getPackageName() + ".action.PUSH_MESSAGE_RECEIVE");

		//comment this code out if you would like to receive the notifications in the notifications center when the app is in foreground
		cordova.getActivity().registerReceiver(mReceiver, intentFilter);

		//registration receiver
		cordova.getActivity().registerReceiver(mBroadcastReceiver, new IntentFilter(cordova.getActivity().getPackageName() + "." + PushManager.REGISTER_BROAD_CAST_ACTION));

		receiversRegistered = true;
	}

	public void unregisterReceivers()
	{
		if (!receiversRegistered)
			return;

		try
		{
			cordova.getActivity().unregisterReceiver(mReceiver);
		}
		catch (Exception e)
		{
			// pass. for some reason Phonegap call this method before onResume. Not Android lifecycle style...
		}

		try
		{
			cordova.getActivity().unregisterReceiver(mBroadcastReceiver);
		}
		catch (Exception e)
		{
			//pass through
		}

		receiversRegistered = false;
	}

	@Override
	public void onResume(boolean multitasking)
	{
		super.onResume(multitasking);
		registerReceivers();
	}

	@Override
	public void onPause(boolean multitasking)
	{
		super.onPause(multitasking);
		unregisterReceivers();
	}

	/**
	 * The final call you receive before your activity is destroyed.
	 */
	public void onDestroy()
	{
		super.onDestroy();
	}

	private void initialize(JSONArray data, CallbackContext callbackContext)
	{
		JSONObject params = null;
		try
		{
			params = data.getJSONObject(0);
		}
		catch (JSONException e)
		{
			e.printStackTrace();
			return;
		}

		try
		{
			String appid = null;
			if (params.has("appid"))
				appid = params.getString("appid");
			else
				appid = params.getString("pw_appid");

			PushManager.initializePushManager(cordova.getActivity(), appid, params.getString("projectid"));
			mPushManager = PushManager.getInstance(cordova.getActivity());
			mPushManager.onStartup(cordova.getActivity());
		}
		catch (Exception e)
		{
			e.printStackTrace();
			return;
		}
	}

	private boolean internalRegister(JSONArray data, CallbackContext callbackContext)
	{
		try
		{
			callbackIds.put("registerDevice", callbackContext);
			mPushManager.registerForPushNotifications();
		}
		catch (java.lang.RuntimeException e)
		{
			callbackIds.remove("registerDevice");
			e.printStackTrace();

			callbackContext.error(e.getMessage());
			return true;
		}

		checkMessage(cordova.getActivity().getIntent());
		return true;
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
				doOnUnregistered(intent.getExtras().getString(PushManager.UNREGISTER_EVENT));
			}
			else if (intent.hasExtra(PushManager.REGISTER_ERROR_EVENT))
			{
				doOnRegisteredError(intent.getExtras().getString(PushManager.REGISTER_ERROR_EVENT));
			}
			else if (intent.hasExtra(PushManager.UNREGISTER_ERROR_EVENT))
			{
				doOnUnregisteredError(intent.getExtras().getString(PushManager.UNREGISTER_ERROR_EVENT));
			}

			intent.removeExtra(PushManager.PUSH_RECEIVE_EVENT);
			intent.removeExtra(PushManager.REGISTER_EVENT);
			intent.removeExtra(PushManager.UNREGISTER_EVENT);
			intent.removeExtra(PushManager.REGISTER_ERROR_EVENT);
			intent.removeExtra(PushManager.UNREGISTER_ERROR_EVENT);

			cordova.getActivity().setIntent(intent);
		}
	}

	private boolean internalUnregister(JSONArray data, CallbackContext callbackContext)
	{
		callbackIds.put("unregisterDevice", callbackContext);

		try
		{
			GCMRegistrar.unregister(cordova.getActivity());
		}
		catch (Exception e)
		{
			callbackIds.remove("unregisterDevice");
			callbackContext.error(e.getMessage());
			return true;
		}

		return true;
	}

	private boolean internalSendLocation(JSONArray data, CallbackContext callbackContext)
	{
		if (mPushManager == null)
		{
			return false;
		}

		JSONObject params = null;
		try
		{
			params = data.getJSONObject(0);
		}
		catch (JSONException e)
		{
			e.printStackTrace();
			return false;
		}

		double lat = 0;
		double lon = 0;

		try
		{
			lat = params.getDouble("lat");
			lon = params.getDouble("lon");
		}
		catch (JSONException e)
		{
			e.printStackTrace();
			return false;
		}

		Location location = new Location("");
		location.setLatitude(lat);
		location.setLongitude(lon);
		PushManager.sendLocation(cordova.getActivity(), location);

		return true;
	}

	private boolean internalSendTags(JSONArray data, final CallbackContext callbackContext)
	{
		JSONObject params;
		try
		{
			params = data.getJSONObject(0);
		}
		catch (JSONException e)
		{
			e.printStackTrace();
			return false;
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
				return false;
			}
		}

		callbackIds.put("setTags", callbackContext);

		final class SendTagsListenerImpl implements SendPushTagsCallBack
		{
			@Override
			public void onSentTagsSuccess(Map<String, String> skippedTags)
			{
				CallbackContext callback = callbackIds.get("setTags");
				if (callback == null)
					return;

				callback.success(new JSONObject(skippedTags));
				callbackIds.remove("setTags");
			}

			@Override
			public void onSentTagsError(Exception e)
			{
				CallbackContext callback = callbackIds.get("setTags");
				if (callback == null)
					return;

				callback.error(e.getMessage());
				callbackIds.remove("setTags");
			}

			@Override
			public void taskStarted() {}
		}
		
		PushManager.sendTags(cordova.getActivity(), paramsMap, new SendTagsListenerImpl());
		return true;
	}

	@Override
	public boolean execute(String action, JSONArray data, CallbackContext callbackId)
	{
		Log.d("PushNotifications", "Plugin Called");

		//make sure the receivers are on
		registerReceivers();

		if (GET_PUSH_TOKEN.equals(action))
		{
			callbackId.success(PushManager.getPushToken(cordova.getActivity()));
			return true;
		}

		if (GET_HWID.equals(action))
		{
			callbackId.success(PushManager.getPushwooshHWID(cordova.getActivity()));
			return true;
		}

		if (ON_DEVICE_READY.equals(action))
		{
			initialize(data, callbackId);
			checkMessage(cordova.getActivity().getIntent());
			deviceReady = true;
			return true;
		}

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

		if (SEND_LOCATION.equals(action))
		{
			return internalSendLocation(data, callbackId);
		}

		if (START_GEO_PUSHES.equals(action) || START_LOCATION_TRACKING.equals(action))
		{
			if (mPushManager == null)
			{
				return false;
			}

			mPushManager.startTrackingGeoPushes();
			return true;
		}

		if (STOP_GEO_PUSHES.equals(action) || STOP_LOCATION_TRACKING.equals(action))
		{
			if (mPushManager == null)
			{
				return false;
			}

			mPushManager.stopTrackingGeoPushes();
			return true;
		}
		if (START_BEACON_PUSHES.equals(action))
		{
			if (mPushManager == null)
			{
				return false;
			}

			mPushManager.startTrackingBeaconPushes();
			return true;
		}

		if (STOP_BEACON_PUSHES.equals(action))
		{
			if (mPushManager == null)
			{
				return false;
			}

			mPushManager.stopTrackingBeaconPushes();
			return true;
		}

		if (SET_BEACON_BACKGROUND_MODE.equals(action))
		{
			try
			{
				boolean type = data.getBoolean(0);
				PushManager.setBeaconBackgroundMode(cordova.getActivity(), type);
			}
			catch (Exception e)
			{
				e.printStackTrace();
				return false;
			}

			return true;
		}

		if (CREATE_LOCAL_NOTIFICATION.equals(action))
		{
			JSONObject params = null;
			try
			{
				params = data.getJSONObject(0);
			}
			catch (JSONException e)
			{
				e.printStackTrace();
				return false;
			}

			try
			{
				//config params: {msg:"message", seconds:30, userData:"optional"}
				String message = params.getString("msg");
				Integer seconds = params.getInt("seconds");
				if (message == null || seconds == null)
					return false;

				String userData = params.getString("userData");

				Bundle extras = new Bundle();
				if (userData != null)
					extras.putString("u", userData);

				PushManager.scheduleLocalNotification(cordova.getActivity(), message, extras, seconds);
			}
			catch (JSONException e)
			{
				e.printStackTrace();
				return false;
			}

			return true;
		}

		if (CLEAR_LOCAL_NOTIFICATION.equals(action))
		{
			PushManager.clearLocalNotifications(cordova.getActivity());
			return true;
		}

		if ("setMultiNotificationMode".equals(action))
		{
			PushManager.setMultiNotificationMode(cordova.getActivity());
			return true;
		}

		if ("setSingleNotificationMode".equals(action))
		{
			PushManager.setSimpleNotificationMode(cordova.getActivity());
			return true;
		}

		if ("setSoundType".equals(action))
		{
			try
			{
				Integer type = (Integer) data.get(0);
				if (type == null)
					return false;

				PushManager.setSoundNotificationType(cordova.getActivity(), SoundType.fromInt(type));
			}
			catch (Exception e)
			{
				e.printStackTrace();
				return false;
			}

			return true;
		}

		if ("setVibrateType".equals(action))
		{
			try
			{
				Integer type = (Integer) data.get(0);
				if (type == null)
					return false;

				PushManager.setVibrateNotificationType(cordova.getActivity(), VibrateType.fromInt(type));
			}
			catch (Exception e)
			{
				e.printStackTrace();
				return false;
			}

			return true;
		}

		if ("setLightScreenOnNotification".equals(action))
		{
			try
			{
				boolean type = (boolean) data.getBoolean(0);
				PushManager.setLightScreenOnNotification(cordova.getActivity(), type);
			}
			catch (Exception e)
			{
				e.printStackTrace();
				return false;
			}

			return true;
		}

		if ("setEnableLED".equals(action))
		{
			try
			{
				boolean type = (boolean) data.getBoolean(0);
				PushManager.setEnableLED(cordova.getActivity(), type);
			}
			catch (Exception e)
			{
				e.printStackTrace();
				return false;
			}

			return true;
		}


		if ("sendGoalAchieved".equals(action))
		{
			JSONObject params = null;
			try
			{
				params = data.getJSONObject(0);
			}
			catch (JSONException e)
			{
				e.printStackTrace();
				return false;
			}

			try
			{
				//config params: {goal:"goalName", count:30}
				String goal = params.getString("goal");
				if (goal == null)
					return false;

				Integer count = null;
				if (params.has("count"))
					count = params.getInt("count");

				PushManager.sendGoalAchieved(cordova.getActivity(), goal, count);
			}
			catch (Exception e)
			{
				e.printStackTrace();
				return false;
			}

			return true;
		}

		if (GET_TAGS.equals(action))
		{
			callbackIds.put("getTags", callbackId);

			final class GetTagsListenerImpl implements GetTagsListener
			{
				@Override
				public void onTagsReceived(Map<String, Object> tags)
				{
					CallbackContext callback = callbackIds.get("getTags");
					if (callback == null)
						return;

					callback.success(new JSONObject(tags));
					callbackIds.remove("getTags");
				}

				@Override
				public void onError(Exception e)
				{
					CallbackContext callback = callbackIds.get("getTags");
					if (callback == null)
						return;

					callback.error(e.getMessage());
					callbackIds.remove("getTags");
				}
			}

			PushManager.getTagsAsync(cordova.getActivity(), new GetTagsListenerImpl());
			return true;
		}
		
		if(action.equals("getPushHistory"))
		{
			ArrayList<String> pushHistory = PushPersistance.getPushHistory(cordova.getActivity());
			callbackId.success(new JSONArray(pushHistory));
			return true;
		}

		if(action.equals("clearPushHistory"))
		{
			PushPersistance.clearPushHistory(cordova.getActivity());
			return true;
		}

		if(action.equals("clearNotificationCenter"))
		{
			PushManager.clearNotificationCenter(cordova.getActivity());
			return true;
		}

		Log.d("DirectoryListPlugin", "Invalid action : " + action + " passed");
		return false;
	}

	private void doOnRegistered(String registrationId)
	{
		CallbackContext callback = callbackIds.get("registerDevice");
		if (callback == null)
			return;

		callback.success(registrationId);
		callbackIds.remove("registerDevice");
	}

	private void doOnRegisteredError(String errorId)
	{
		CallbackContext callback = callbackIds.get("registerDevice");
		if (callback == null)
			return;

		callback.error(errorId);
		callbackIds.remove("registerDevice");
	}

	private void doOnUnregistered(String registrationId)
	{
		CallbackContext callback = callbackIds.get("unregisterDevice");
		if (callback == null)
			return;

		callback.success(registrationId);
		callbackIds.remove("unregisterDevice");
	}

	private void doOnUnregisteredError(String errorId)
	{
		CallbackContext callback = callbackIds.get("unregisterDevice");
		if (callback == null)
			return;

		callback.error(errorId);
		callbackIds.remove("unregisterDevice");
	}

	private void doOnMessageReceive(String message)
	{
		Log.e("doOnMessageReceive", "message is: " + message);
		final String jsStatement = String.format("window.plugins.pushNotification.notificationCallback(%s);", message);
		//webView.sendJavascript(jsStatement);

		cordova.getActivity().runOnUiThread(
				new Runnable()
				{
					@Override
					public void run()
					{
						webView.loadUrl("javascript:" + jsStatement);
					}
				}
		);
	}

	private BroadcastReceiver mReceiver = new BasePushMessageReceiver()
	{
		@Override
		protected void onMessageReceive(Intent intent)
		{
			doOnMessageReceive(intent.getStringExtra(JSON_DATA_KEY));
		}
	};
}
