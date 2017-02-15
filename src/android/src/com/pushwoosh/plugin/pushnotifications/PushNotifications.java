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

import java.lang.annotation.Retention;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
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

import static java.lang.annotation.RetentionPolicy.RUNTIME;

public class PushNotifications extends CordovaPlugin
{
	private static final String TAG = "CordovaPlugin";

	boolean receiversRegistered = false;
	boolean broadcastPush = true;
	JSONObject startPushData = null;

	HashMap<String, CallbackContext> callbackIds = new HashMap<String, CallbackContext>();
	PushManager mPushManager = null;

	private static final Map<String, Method> exportedMethods;

	@Retention(RUNTIME)
	@interface CordovaMethod {

	}

	static
	{
		HashMap<String, Method> methods = new HashMap<String, Method>();

		final List<Method> allMethods = new ArrayList<Method>(Arrays.asList(PushNotifications.class.getDeclaredMethods()));
		for (final Method method : allMethods) {
			if (method.isAnnotationPresent(CordovaMethod.class)) {
				methods.put(method.getName(), method);
			}
		}

		exportedMethods = methods;
	}

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
			doOnPushOpened(intent.getStringExtra(JSON_DATA_KEY));
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
				doOnPushOpened(intent.getExtras().getString(PushManager.PUSH_RECEIVE_EVENT));
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

	@CordovaMethod
	private boolean onDeviceReady(JSONArray data, CallbackContext callbackContext)
	{
		JSONObject params = null;
		try
		{
			params = data.getJSONObject(0);
		}
		catch (JSONException e)
		{
			PWLog.error(TAG, "No parameters has been passed to onDeviceReady function. Did you follow the guide correctly?", e);
			return false;
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

			NotificationFactory factory = new NotificationFactory();
			factory.setPlugin(this);
			mPushManager.setNotificationFactory(factory);
		}
		catch (Exception e)
		{
			PWLog.error(TAG, "Missing pw_appid parameter. Did you follow the guide correctly?", e);
			return false;
		}

		checkMessage(cordova.getActivity().getIntent());
		return true;
	}

	@CordovaMethod
	private boolean registerDevice(JSONArray data, CallbackContext callbackContext)
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
		}

		checkMessage(cordova.getActivity().getIntent());
		return true;
	}

	@CordovaMethod
	private boolean unregisterDevice(JSONArray data, CallbackContext callbackContext)
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
		}

		return true;
	}

	@CordovaMethod
	private boolean setTags(JSONArray data, final CallbackContext callbackContext)
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

		Map<String, Object> tags = JsonUtils.jsonToMap(params);

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

		PushManager.sendTags(cordova.getActivity(), tags, new SendTagsListenerImpl());
		return true;
	}

	@CordovaMethod
	private boolean getTags(JSONArray data, final CallbackContext callbackContext)
	{
		callbackIds.put("getTags", callbackContext);

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

	@CordovaMethod
	private boolean getPushToken(JSONArray data, final CallbackContext callbackContext)
	{
		callbackContext.success(PushManager.getPushToken(cordova.getActivity()));
		return true;
	}

	@CordovaMethod
	private boolean getPushwooshHWID(JSONArray data, final CallbackContext callbackContext)
	{
		callbackContext.success(PushManager.getPushwooshHWID(cordova.getActivity()));
		return true;
	}

	@CordovaMethod
	private boolean startLocationTracking(JSONArray data, final CallbackContext callbackContext)
	{
		mPushManager.startTrackingGeoPushes();
		return true;
	}

	@CordovaMethod
	private boolean stopLocationTracking(JSONArray data, final CallbackContext callbackContext)
	{
		mPushManager.stopTrackingGeoPushes();
		return true;
	}

	@CordovaMethod
	private boolean startBeaconPushes(JSONArray data, final CallbackContext callbackContext)
	{
		mPushManager.startTrackingBeaconPushes();
		return true;
	}

	@CordovaMethod
	private boolean stopBeaconPushes(JSONArray data, final CallbackContext callbackContext)
	{
		mPushManager.stopTrackingBeaconPushes();
		return true;
	}

	@CordovaMethod
	private boolean setBeaconBackgroundMode(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean createLocalNotification(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean clearLocalNotification(JSONArray data, final CallbackContext callbackContext)
	{
		PushManager.clearLocalNotifications(cordova.getActivity());
		return true;
	}

	@CordovaMethod
	private boolean getLaunchNotification(JSONArray data, final CallbackContext callbackContext)
	{
		String launchNotification = mPushManager.getLaunchNotification();
		// unfortunately null object can only be returned as String
		if (launchNotification != null)
		{
			callbackContext.success(launchNotification);
		}
		else
		{
			callbackContext.success((String) null);
		}
		return true;
	}

	@CordovaMethod
	private boolean clearLaunchNotification(JSONArray data, final CallbackContext callbackContext)
	{
		mPushManager.clearLaunchNotification();
		return true;
	}

	@CordovaMethod
	private boolean setMultiNotificationMode(JSONArray data, final CallbackContext callbackContext)
	{
		PushManager.setMultiNotificationMode(cordova.getActivity());
		return true;
	}

	@CordovaMethod
	private boolean setSingleNotificationMode(JSONArray data, final CallbackContext callbackContext)
	{
		PushManager.setSimpleNotificationMode(cordova.getActivity());
		return true;
	}

	@CordovaMethod
	private boolean setSoundType(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean setVibrateType(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean setLightScreenOnNotification(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean setEnableLED(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean setColorLED(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean getPushHistory(JSONArray data, final CallbackContext callbackContext)
	{
		ArrayList<String> pushHistory = mPushManager.getPushHistory();
		callbackContext.success(new JSONArray(pushHistory));
		return true;
	}

	@CordovaMethod
	private boolean clearPushHistory(JSONArray data, final CallbackContext callbackContext)
	{
		mPushManager.clearPushHistory();
		return true;
	}

	@CordovaMethod
	private boolean clearNotificationCenter(JSONArray data, final CallbackContext callbackContext)
	{
		PushManager.clearNotificationCenter(cordova.getActivity());
		return true;
	}

	@CordovaMethod
	private boolean setApplicationIconBadgeNumber(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean getApplicationIconBadgeNumber(JSONArray data, final CallbackContext callbackContext)
	{
		Integer badgeNumber = new Integer(mPushManager.getBadgeNumber());
		callbackContext.success(badgeNumber);
		return true;
	}

	@CordovaMethod
	private boolean addToApplicationIconBadgeNumber(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean setUserId(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean postEvent(JSONArray data, final CallbackContext callbackContext)
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

	@CordovaMethod
	private boolean getRemoteNotificationStatus(JSONArray data, final CallbackContext callbackContext)
	{
		try
		{
			String enabled = PushManager.isNotificationEnabled(cordova.getActivity()) ? "1" : "0";
			JSONObject result = new JSONObject();
			result.put("enabled", enabled);
			callbackContext.success(result);
		}
		catch (Exception e)
		{
			callbackContext.error(e.getMessage());
		}

		return true;
	}

	@Override
	public boolean execute(String action, JSONArray data, CallbackContext callbackId)
	{
		PWLog.debug(TAG, "Plugin Method Called: " + action);

		Method method = exportedMethods.get(action);
		if (method == null)
		{
			PWLog.debug(TAG, "Invalid action : " + action + " passed");
			return false;
		}

		try
		{
			Boolean result = (Boolean) method.invoke(this, data, callbackId);
			return result;
		}
		catch (Exception e)
		{
			PWLog.error(TAG, "Failed to execute action : " + action, e);
			return false;
		}
	}

	private void doOnRegistered(String registrationId)
	{
		CallbackContext callback = callbackIds.get("registerDevice");
		if (callback == null)
			return;

		try
		{
			JSONObject result = new JSONObject();
			result.put("pushToken", registrationId);
			callback.success(result);
		}
		catch (Exception e)
		{
			callback.error("Internal error");
		}

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

	private void doOnPushOpened(String notification)
	{
		PWLog.debug(TAG, "push opened: " + notification);

		String jsStatement = String.format("cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").notificationCallback(%s);", convertNotification(notification));
		evalJs(jsStatement);
	}

	public void doOnPushReceived(String notification)
	{
		PWLog.debug(TAG, "push received: " + notification);

		String jsStatement = String.format("cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").pushReceivedCallback(%s);", convertNotification(notification));
		evalJs(jsStatement);
	}

	private String convertNotification(String notification)
	{
		JSONObject unifiedNotification = new JSONObject();

		try
		{
			JSONObject notificationJson = new JSONObject(notification);
			String pushMessage = notificationJson.optString("title");
			Boolean foreground = notificationJson.optBoolean("foreground");
			Boolean onStart = notificationJson.optBoolean("onStart");
			JSONObject userData = notificationJson.optJSONObject("userdata");


			unifiedNotification.put("android", notificationJson);
			unifiedNotification.put("message", pushMessage);
			unifiedNotification.put("foreground", foreground);
			unifiedNotification.put("onStart", onStart);
			unifiedNotification.put("userdata", userData);
		}
		catch (JSONException e) {
			PWLog.error(TAG, "push message parsing failed", e);
		}

		String result = unifiedNotification.toString();

		// wrap special characters
		result = result.replace("%", "%\"+\"");

		return result;
	}

	private void evalJs(String statement)
	{
		final String url = "javascript:" + statement;

		cordova.getActivity().runOnUiThread(new Runnable()
		{
			@Override
			public void run()
			{
				try
				{
					webView.loadUrl(url);
				}
				catch (Exception e)
				{
					PWLog.exception(e);
				}
			}
		});
	}
}
