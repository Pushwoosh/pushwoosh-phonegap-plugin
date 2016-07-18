//
// PushNotifications.java
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
import android.os.Bundle;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;

import com.pushwoosh.PushManager;
import com.pushwoosh.internal.utils.PWLog;
import com.pushwoosh.notification.SoundType;
import com.pushwoosh.notification.VibrateType;
import com.pushwoosh.PushManager.GetTagsListener;
import com.pushwoosh.BasePushMessageReceiver;
import com.pushwoosh.BaseRegistrationReceiver;
import com.pushwoosh.SendPushTagsCallBack;
import com.pushwoosh.internal.utils.GeneralUtils;
import com.pushwoosh.internal.utils.JsonUtils;
import com.pushwoosh.inapp.InAppFacade;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class PushNotifications extends CordovaPlugin
{
	public static final String ACTION_REGISTER = "registerDevice";
	public static final String ACTION_UNREGISTER = "unregisterDevice";
	public static final String ACTION_SET_TAGS = "setTags";
	public static final String ACTION_START_GEO_PUSHES = "startGeoPushes";
	public static final String ACTION_START_LOCATION_TRACKING = "startLocationTracking";
	public static final String ACTION_STOP_GEO_PUSHES = "stopGeoPushes";
	public static final String ACTION_STOP_LOCATION_TRACKING = "stopLocationTracking";
	public static final String ACTION_START_BEACON_PUSHES = "startBeaconPushes";
	public static final String ACTION_STOP_BEACON_PUSHES = "stopBeaconPushes";
	public static final String ACTION_SET_BEACON_BACKGROUND_MODE = "setBeaconBackgroundMode";
	public static final String ACTION_CREATE_LOCAL_NOTIFICATION = "createLocalNotification";
	public static final String ACTION_CLEAR_LOCAL_NOTIFICATION = "clearLocalNotification";
	public static final String ACTION_GET_TAGS = "getTags";
	public static final String ACTION_ON_DEVICE_READY = "onDeviceReady";
	public static final String ACTION_GET_PUSH_TOKEN = "getPushToken";
	public static final String ACTION_GET_HWID = "getPushwooshHWID";
	public static final String ACTION_GET_LAUNCH_NOTIFICATION = "getLaunchNotification";
	public static final String ACTION_SET_MULTI_NOTIFICATION_MODE = "setMultiNotificationMode";
	public static final String ACTION_SET_SINGLE_NOTIFICATION_MODE = "setSingleNotificationMode";
	public static final String ACTION_SET_SOUND_TYPE = "setSoundType";
	public static final String ACTION_SET_VIBRATE_TYPE = "setVibrateType";
	public static final String ACTION_SET_LIGHTSCREEN_ON_NOTIFICATION = "setLightScreenOnNotification";
	public static final String ACTION_SET_ENAGLE_LED = "setEnableLED";
	public static final String ACTION_SET_COLOR_LED = "setColorLED";
	public static final String ACTION_GET_PUSH_HISTORY = "getPushHistory";
	public static final String ACTION_CLEAR_PUSH_HISTORY = "clearPushHistory";
	public static final String ACTION_CLEAR_NOTIFICATION_CENTER = "clearNotificationCenter";
	public static final String ACTION_SET_APPLICATION_ICON_BADGE_NUMBER = "setApplicationIconBadgeNumber";
	public static final String ACTION_GET_APPLICATION_ICON_BADGE_NUMBER = "getApplicationIconBadgeNumber";
	public static final String ACTION_ADD_TO_APPLICATION_ICON_BADGE_NUMBER = "addToApplicationIconBadgeNumber";
	public static final String ACTION_SET_USER_ID = "setUserId";
	public static final String ACTION_POST_EVENT = "postEvent";

	boolean receiversRegistered = false;
	boolean broadcastPush = true;
	JSONObject startPushData = null;

	HashMap<String, CallbackContext> callbackIds = new HashMap<String, CallbackContext>();
	PushManager mPushManager = null;

	private String TAG = "CordovaPlugin";

	/**
	 * Called when the activity receives a new intent.
	 */
	public void onNewIntent(Intent intent)
	{
		super.onNewIntent(intent);

		startPushData = getPushFromIntent(intent);
		checkMessage(intent);
	}

	private BroadcastReceiver mRegistrationReceiver = new BaseRegistrationReceiver()
	{
		@Override
		public void onRegisterActionReceive(Context context, Intent intent)
		{
			checkMessage(intent);
		}
	};

	private BroadcastReceiver mPushReceiver = new BasePushMessageReceiver()
	{
		@Override
		protected void onMessageReceive(Intent intent)
		{
			doOnMessageReceive(intent.getStringExtra(JSON_DATA_KEY));
		}
	};

	//Registration of the receivers
	public void registerReceivers()
	{
		if (receiversRegistered)
			return;

		IntentFilter intentFilter = new IntentFilter(cordova.getActivity().getPackageName() + ".action.PUSH_MESSAGE_RECEIVE");

		//comment this code out if you would like to receive the notifications in the notifications center when the app is in foreground
		if (broadcastPush)
			cordova.getActivity().registerReceiver(mPushReceiver, intentFilter);

		//registration receiver
		cordova.getActivity().registerReceiver(mRegistrationReceiver, new IntentFilter(cordova.getActivity().getPackageName() + "." + PushManager.REGISTER_BROAD_CAST_ACTION));

		receiversRegistered = true;
	}

	public void unregisterReceivers()
	{
		if (!receiversRegistered)
			return;

		try
		{
			cordova.getActivity().unregisterReceiver(mPushReceiver);
		}
		catch (Exception e)
		{
			// pass. for some reason Phonegap call this method before onResume. Not Android lifecycle style...
		}

		try
		{
			cordova.getActivity().unregisterReceiver(mRegistrationReceiver);
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
			PWLog.error(TAG, "No parameters has been passed to onDeviceReady function. Did you follow the guide correctly?", e);
			return;
		}

		try
		{
			String packageName = cordova.getActivity().getApplicationContext().getPackageName();
			ApplicationInfo ai = cordova.getActivity().getPackageManager().getApplicationInfo(packageName, PackageManager.GET_META_DATA);
			
			if (ai.metaData != null && ai.metaData.containsKey("PW_NO_BROADCAST_PUSH"))
				broadcastPush = !(ai.metaData.getBoolean("PW_NO_BROADCAST_PUSH"));

			PWLog.debug(TAG, "broadcastPush = " + broadcastPush);
		}
		catch (Exception e)
		{
			PWLog.error(TAG, "Failed to read AndroidManifest");
		}

		try
		{
			//make sure the receivers are on
			registerReceivers();

			startPushData = getPushFromIntent(cordova.getActivity().getIntent());

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
			PWLog.error(TAG, "Missing pw_appid parameter. Did you follow the guide correctly?", e);
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
			callbackIds.remove("registerDevice");;
			PWLog.error(TAG, "registering for push notifications failed", e);

			callbackContext.error(e.getMessage());
			return true;
		}

		checkMessage(cordova.getActivity().getIntent());
		return true;
	}

	private JSONObject getPushFromIntent(Intent intent)
	{
		if (null == intent)
			return null;

		if (intent.hasExtra(PushManager.PUSH_RECEIVE_EVENT))
		{
			String pushString = intent.getExtras().getString(PushManager.PUSH_RECEIVE_EVENT);
			JSONObject pushObject = null;
			try
			{
				pushObject = new JSONObject(pushString);
			}
			catch (JSONException e)
			{
				PWLog.error(TAG, "Failed to parse push notification", e);
			}

			return pushObject;
		}

		return null;
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
			mPushManager.unregisterForPushNotifications();
		}
		catch (Exception e)
		{
			callbackIds.remove("unregisterDevice");
			callbackContext.error(e.getMessage());
			return true;
		}

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
			PWLog.error(TAG, "No tags information passed (missing parameters)", e);
			return false;
		}

		@SuppressWarnings("unchecked")
		Iterator<String> nameItr = params.keys();
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
				PWLog.error(TAG, "Tag parameter is invalid", e);
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
			public void taskStarted()
			{
			}
		}

		PushManager.sendTags(cordova.getActivity(), paramsMap, new SendTagsListenerImpl());
		return true;
	}

	@Override
	public boolean execute(String action, JSONArray data, CallbackContext callbackId)
	{
		PWLog.debug(TAG, "Plugin Method Called: " + action);

		if (ACTION_GET_PUSH_TOKEN.equals(action))
		{
			callbackId.success(PushManager.getPushToken(cordova.getActivity()));
			return true;
		}

		if (ACTION_GET_HWID.equals(action))
		{
			callbackId.success(PushManager.getPushwooshHWID(cordova.getActivity()));
			return true;
		}

		if (ACTION_ON_DEVICE_READY.equals(action))
		{
			initialize(data, callbackId);
			checkMessage(cordova.getActivity().getIntent());
			return true;
		}

		if (ACTION_REGISTER.equals(action))
		{
			return internalRegister(data, callbackId);
		}

		if (ACTION_UNREGISTER.equals(action))
		{
			return internalUnregister(data, callbackId);
		}

		if (ACTION_SET_TAGS.equals(action))
		{
			return internalSendTags(data, callbackId);
		}

		if (ACTION_START_GEO_PUSHES.equals(action) || ACTION_START_LOCATION_TRACKING.equals(action))
		{
			if (mPushManager == null)
			{
				return false;
			}

			mPushManager.startTrackingGeoPushes();
			return true;
		}

		if (ACTION_STOP_GEO_PUSHES.equals(action) || ACTION_STOP_LOCATION_TRACKING.equals(action))
		{
			if (mPushManager == null)
			{
				return false;
			}

			mPushManager.stopTrackingGeoPushes();
			return true;
		}
		if (ACTION_START_BEACON_PUSHES.equals(action))
		{
			if (mPushManager == null)
			{
				return false;
			}

			mPushManager.startTrackingBeaconPushes();
			return true;
		}

		if (ACTION_STOP_BEACON_PUSHES.equals(action))
		{
			if (mPushManager == null)
			{
				return false;
			}

			mPushManager.stopTrackingBeaconPushes();
			return true;
		}

		if (ACTION_SET_BEACON_BACKGROUND_MODE.equals(action))
		{
			try
			{
				boolean type = data.getBoolean(0);
				PushManager.setBeaconBackgroundMode(cordova.getActivity(), type);
			}
			catch (Exception e)
			{
				PWLog.error(TAG, "No parameters passed (missing parameters)", e);
				return false;
			}

			return true;
		}

		if (ACTION_CREATE_LOCAL_NOTIFICATION.equals(action))
		{
			JSONObject params = null;
			try
			{
				params = data.getJSONObject(0);
			}
			catch (JSONException e)
			{
				PWLog.error(TAG, "No parameters passed (missing parameters)", e);
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
				PWLog.error(TAG, "Not correct parameters passed (missing parameters)", e);
				return false;
			}

			return true;
		}

		if (ACTION_CLEAR_LOCAL_NOTIFICATION.equals(action))
		{
			PushManager.clearLocalNotifications(cordova.getActivity());
			return true;
		}

		if (ACTION_GET_LAUNCH_NOTIFICATION.equals(action))
		{
			// unfortunately null object can only be returned as String
			if (startPushData != null)
			{
				callbackId.success(startPushData);
			}
			else
			{
				callbackId.success((String) null);
			}
			return true;
		}

		if (ACTION_SET_MULTI_NOTIFICATION_MODE.equals(action))
		{
			PushManager.setMultiNotificationMode(cordova.getActivity());
			return true;
		}

		if (ACTION_SET_SINGLE_NOTIFICATION_MODE.equals(action))
		{
			PushManager.setSimpleNotificationMode(cordova.getActivity());
			return true;
		}

		if (ACTION_SET_SOUND_TYPE.equals(action))
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
				PWLog.error(TAG, "No sound parameters passed (missing parameters)", e);
				return false;
			}

			return true;
		}

		if (ACTION_SET_VIBRATE_TYPE.equals(action))
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
				PWLog.error(TAG, "No vibration parameters passed (missing parameters)", e);
				return false;
			}

			return true;
		}

		if (ACTION_SET_LIGHTSCREEN_ON_NOTIFICATION.equals(action))
		{
			try
			{
				boolean type = (boolean) data.getBoolean(0);
				PushManager.setLightScreenOnNotification(cordova.getActivity(), type);
			}
			catch (Exception e)
			{
				PWLog.error(TAG, "No parameters passed (missing parameters)", e);
				return false;
			}

			return true;
		}

		if (ACTION_SET_ENAGLE_LED.equals(action))
		{
			try
			{
				boolean type = (boolean) data.getBoolean(0);
				PushManager.setEnableLED(cordova.getActivity(), type);
			}
			catch (Exception e)
			{
				PWLog.error(TAG, "No parameters passed (missing parameters)", e);
				return false;
			}

			return true;
		}

		if (ACTION_SET_COLOR_LED.equals(action))
		{
			try
			{
				String colorString = (String) data.get(0);
				if (colorString == null)
					return false;

				int colorLed = GeneralUtils.parseColor(colorString);
				PushManager.setColorLED(cordova.getActivity(), colorLed);
			}
			catch (Exception e)
			{
				PWLog.error(TAG, "No parameters passed (missing parameters)", e);
				return false;
			}

			return true;
		}

		if (ACTION_GET_TAGS.equals(action))
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

		if (ACTION_GET_PUSH_HISTORY.equals(action))
		{
			ArrayList<String> pushHistory = mPushManager.getPushHistory();
			callbackId.success(new JSONArray(pushHistory));
			return true;
		}

		if (ACTION_CLEAR_PUSH_HISTORY.equals(action))
		{
			mPushManager.clearPushHistory();
			return true;
		}

		if (ACTION_CLEAR_NOTIFICATION_CENTER.equals(action))
		{
			PushManager.clearNotificationCenter(cordova.getActivity());
			return true;
		}

		if (ACTION_SET_APPLICATION_ICON_BADGE_NUMBER.equals(action))
		{
			try
			{
				Integer badgeNumber = data.getJSONObject(0).getInt("badge");
				if (badgeNumber == null)
					return false;

				mPushManager.setBadgeNumber(badgeNumber);
			}
			catch (JSONException e)
			{
				PWLog.error(TAG, "No parameters passed (missing parameters)", e);
				return false;
			}
			return true;
		}

		if (ACTION_GET_APPLICATION_ICON_BADGE_NUMBER.equals(action))
		{
			Integer badgeNumber = new Integer(mPushManager.getBadgeNumber());
			callbackId.success(badgeNumber);
			return true;
		}

		if (ACTION_ADD_TO_APPLICATION_ICON_BADGE_NUMBER.equals(action))
		{
			try
			{
				Integer badgeNumber = data.getJSONObject(0).getInt("badge");
				if (badgeNumber == null)
					return false;
				mPushManager.addBadgeNumber(badgeNumber);
			}
			catch (JSONException e)
			{
				PWLog.error(TAG, "No parameters passed (missing parameters)", e);
				return false;
			}
			return true;
		}

		if (ACTION_SET_USER_ID.equals(action))
		{
			try
			{
				String userId = data.getString(0);
				mPushManager.setUserId(cordova.getActivity(), userId);
			}
			catch (JSONException e)
			{
				PWLog.error(TAG, "No parameters passed (missing parameters)", e);
			}
			return true;
		}

		if (ACTION_POST_EVENT.equals(action))
		{
			try
			{
				String event = data.getString(0);
				JSONObject attributes = data.getJSONObject(1);
				InAppFacade.postEvent(cordova.getActivity(), event, JsonUtils.jsonToMap(attributes));
			}
			catch (JSONException e)
			{
				PWLog.error(TAG, "No parameters passed (missing parameters)", e);
			}
			return true;
		}

		PWLog.debug(TAG, "Invalid action : " + action + " passed");
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
		PWLog.error(TAG, "message is: " + message);
		final String jsStatement = String.format("cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").notificationCallback(%s);", message);
		//webView.sendJavascript(jsStatement);

		cordova.getActivity().runOnUiThread(new Runnable()
		{
			@Override
			public void run()
			{
				webView.loadUrl("javascript:" + jsStatement);
			}
		});
	}
}
