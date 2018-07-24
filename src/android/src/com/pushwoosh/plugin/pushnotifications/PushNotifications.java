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

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.v4.app.NotificationManagerCompat;
import android.webkit.JavascriptInterface;

import com.pushwoosh.GDPRManager;
import com.pushwoosh.Pushwoosh;
import com.pushwoosh.badge.PushwooshBadge;
import com.pushwoosh.beacon.PushwooshBeacon;
import com.pushwoosh.exception.GetTagsException;
import com.pushwoosh.exception.PushwooshException;
import com.pushwoosh.exception.RegisterForPushNotificationsException;
import com.pushwoosh.exception.UnregisterForPushNotificationException;
import com.pushwoosh.function.Callback;
import com.pushwoosh.function.Result;
import com.pushwoosh.inapp.PushwooshInApp;
import com.pushwoosh.inbox.ui.presentation.view.activity.InboxActivity;
import com.pushwoosh.internal.platform.utils.GeneralUtils;
import com.pushwoosh.internal.utils.PWLog;
import com.pushwoosh.location.PushwooshLocation;
import com.pushwoosh.notification.LocalNotification;
import com.pushwoosh.notification.LocalNotificationReceiver;
import com.pushwoosh.notification.PushMessage;
import com.pushwoosh.notification.PushwooshNotificationSettings;
import com.pushwoosh.notification.SoundType;
import com.pushwoosh.notification.VibrateType;
import com.pushwoosh.tags.Tags;
import com.pushwoosh.tags.TagsBundle;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.annotation.Retention;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import static java.lang.annotation.RetentionPolicy.RUNTIME;

public class PushNotifications extends CordovaPlugin {
	public static final String TAG = "CordovaPlugin";
	private static final Object sStartPushLock = new Object();

	private static String sStartPushData;
	private static String sReceivedPushData;

	private static AtomicBoolean sAppReady = new AtomicBoolean();
	private static PushNotifications sInstance;

	private final HashMap<String, CallbackContext> callbackIds = new HashMap<String, CallbackContext>();

	private static final Map<String, Method> exportedMethods;

	@Retention(RUNTIME)
	@interface CordovaMethod {

	}

	static {
		HashMap<String, Method> methods = new HashMap<String, Method>();

		final List<Method> allMethods = new ArrayList<Method>(Arrays.asList(PushNotifications.class.getDeclaredMethods()));
		for (final Method method : allMethods) {
			if (method.isAnnotationPresent(CordovaMethod.class)) {
				methods.put(method.getName(), method);
			}
		}

		exportedMethods = methods;
	}

	private final Handler handler = new Handler(Looper.getMainLooper());

	public PushNotifications () {
		sInstance = this;
		sAppReady.set(false);
	}

	@Override
	public void onDestroy() {
		super.onDestroy();
		PWLog.noise("OnDestroy");
		sAppReady.set(false);
	}

	private JSONObject getPushFromIntent(Intent intent) {
		if (null == intent)
			return null;

		if (intent.hasExtra(Pushwoosh.PUSH_RECEIVE_EVENT)) {
			String pushString = intent.getExtras().getString(Pushwoosh.PUSH_RECEIVE_EVENT);
			JSONObject pushObject = null;
			try {
				pushObject = new JSONObject(pushString);
			} catch (JSONException e) {
				PWLog.error(TAG, "Failed to parse push notification", e);
			}

			return pushObject;
		}

		return null;
	}

	@CordovaMethod
	private boolean onDeviceReady(JSONArray data, CallbackContext callbackContext) {
		JSONObject params = null;
		try {
			params = data.getJSONObject(0);
		} catch (JSONException e) {
			PWLog.error(TAG, "No parameters has been passed to onDeviceReady function. Did you follow the guide correctly?", e);
			return false;
		}

		try {

			String appid = null;
			if (params.has("appid")) {
				appid = params.getString("appid");
			} else {
				appid = params.getString("pw_appid");
			}

			Pushwoosh.getInstance().setAppId(appid);
			Pushwoosh.getInstance().setSenderId(params.getString("projectid"));


			synchronized (sStartPushLock) {
				if (sReceivedPushData != null) {
					doOnPushReceived(sReceivedPushData);
				}

				if (sStartPushData != null) {
					doOnPushOpened(sStartPushData);
				}
			}

			sAppReady.set(true);
		} catch (Exception e) {
			PWLog.error(TAG, "Missing pw_appid parameter. Did you follow the guide correctly?", e);
			return false;
		}
		return true;
	}

	@CordovaMethod
	private boolean registerDevice(JSONArray data, CallbackContext callbackContext) {
		try {
			callbackIds.put("registerDevice", callbackContext);
			Pushwoosh.getInstance().registerForPushNotifications(new Callback<String, RegisterForPushNotificationsException>() {
				@Override
				public void process(@NonNull final Result<String, RegisterForPushNotificationsException> result) {
					if (result.isSuccess()) {
						doOnRegistered(result.getData());
					} else if (result.getException() != null) {
						doOnRegisteredError(result.getException().getMessage());
					}
				}
			});
		} catch (java.lang.RuntimeException e) {
			callbackIds.remove("registerDevice");
			PWLog.error(TAG, "registering for push notifications failed", e);

			callbackContext.error(e.getMessage());
		}

		return true;
	}

	@CordovaMethod
	private boolean unregisterDevice(JSONArray data, CallbackContext callbackContext) {
		callbackIds.put("unregisterDevice", callbackContext);

		try {
			Pushwoosh.getInstance().unregisterForPushNotifications(new Callback<String, UnregisterForPushNotificationException>() {
				@Override
				public void process(@NonNull final Result<String, UnregisterForPushNotificationException> result) {
					if (result.isSuccess()) {
						doOnUnregistered(result.getData());
					} else if (result.getException() != null) {
						doOnUnregisteredError(result.getException().getMessage());
					}
				}
			});
		} catch (Exception e) {
			callbackIds.remove("unregisterDevice");
			callbackContext.error(e.getMessage());
		}

		return true;
	}

	@CordovaMethod
	private boolean setTags(JSONArray data, final CallbackContext callbackContext) {
		JSONObject params;
		try {
			params = data.getJSONObject(0);
		} catch (JSONException e) {
			PWLog.error(TAG, "No tags information passed (missing parameters)", e);
			return false;
		}
		callbackIds.put("setTags", callbackContext);

		Pushwoosh.getInstance().sendTags(Tags.fromJson(params), new Callback<Void, PushwooshException>() {
			@Override
			public void process(@NonNull final Result<Void, PushwooshException> result) {
				CallbackContext callback = callbackIds.get("setTags");
				if (callback == null) {
					return;
				}

				if(result.isSuccess()){
					callback.success(new JSONObject());
				} else if(result.getException()!=null){
					callback.error(result.getException().getMessage());
				}

				callbackIds.remove("setTags");
			}
		});

		return true;
	}

	@CordovaMethod
	private boolean getTags(JSONArray data, final CallbackContext callbackContext) {
		callbackIds.put("getTags", callbackContext);

		Pushwoosh.getInstance().getTags(new Callback<TagsBundle, GetTagsException>() {
			@Override
			public void process(@NonNull final Result<TagsBundle, GetTagsException> result) {
				CallbackContext callback = callbackIds.get("getTags");
				if (callback == null)
					return;

				if(result.isSuccess()) {
					callback.success(result.getData().toJson());
				} else {
					callback.error(result.getException().getMessage());
				}
				callbackIds.remove("getTags");
			}
		});
		return true;
	}

	@CordovaMethod
	private boolean getPushToken(JSONArray data, final CallbackContext callbackContext) {
		callbackContext.success(Pushwoosh.getInstance().getPushToken());
		return true;
	}

	@CordovaMethod
	private boolean getPushwooshHWID(JSONArray data, final CallbackContext callbackContext) {
		callbackContext.success(Pushwoosh.getInstance().getHwid());
		return true;
	}

	@CordovaMethod
	private boolean startLocationTracking(JSONArray data, final CallbackContext callbackContext) {
		PushwooshLocation.startLocationTracking();
		return true;
	}

	@CordovaMethod
	private boolean stopLocationTracking(JSONArray data, final CallbackContext callbackContext)
	{
		PushwooshLocation.stopLocationTracking();
		return true;
	}

	@CordovaMethod
	private boolean startBeaconPushes(JSONArray data, final CallbackContext callbackContext)
	{
		PushwooshBeacon.startTrackingBeaconPushes();
		return true;
	}

	@CordovaMethod
	private boolean stopBeaconPushes(JSONArray data, final CallbackContext callbackContext)
	{
		PushwooshBeacon.stopTrackingBeaconPushes();
		return true;
	}

	@CordovaMethod
	private boolean setBeaconBackgroundMode(JSONArray data, final CallbackContext callbackContext)
	{
		try
		{
			boolean type = data.getBoolean(0);
			PushwooshBeacon.setBeaconBackgroundMode(type);
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
			int seconds = params.getInt("seconds");
			if (message == null) {
				return false;
			}

			String userData = params.getString("userData");

			Bundle extras = new Bundle();
			if (userData != null) {
				extras.putString("u", userData);
			}

			LocalNotification notification = new LocalNotification.Builder()
					.setMessage(message)
					.setDelay(seconds)
					.setExtras(extras)
					.build();
			Pushwoosh.getInstance().scheduleLocalNotification(notification);
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
		LocalNotificationReceiver.cancelAll();
		return true;
	}

	@CordovaMethod
	private boolean getLaunchNotification(JSONArray data, final CallbackContext callbackContext)
	{
		PushMessage launchNotification = Pushwoosh.getInstance().getLaunchNotification();
		if (launchNotification == null) {
			callbackContext.success((String) null);
		} else {
			callbackContext.success(launchNotification.toJson().toString());
		}
		return true;
	}

	@CordovaMethod
	private boolean clearLaunchNotification(JSONArray data, final CallbackContext callbackContext)
	{
		Pushwoosh.getInstance().clearLaunchNotification();
		return true;
	}

	@CordovaMethod
	private boolean setMultiNotificationMode(JSONArray data, final CallbackContext callbackContext)
	{
		PushwooshNotificationSettings.setMultiNotificationMode(true);
		return true;
	}

	@CordovaMethod
	private boolean setSingleNotificationMode(JSONArray data, final CallbackContext callbackContext)
	{
		PushwooshNotificationSettings.setMultiNotificationMode(false);
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

			PushwooshNotificationSettings.setSoundNotificationType(SoundType.fromInt(type));
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

			PushwooshNotificationSettings.setVibrateNotificationType(VibrateType.fromInt(type));
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
			PushwooshNotificationSettings.setLightScreenOnNotification(type);
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
			PushwooshNotificationSettings.setEnableLED(type);
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
			PushwooshNotificationSettings.setColorLED(colorLed);
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
		List<PushMessage> pushMessageHistory = Pushwoosh.getInstance().getPushHistory();
		List<String> pushHistory = new ArrayList<String>();

		for (PushMessage pushMessage: pushMessageHistory){
			pushHistory.add(pushMessage.toJson().toString());
		}
		callbackContext.success(new JSONArray(pushHistory));
		return true;
	}

	@CordovaMethod
	private boolean clearPushHistory(JSONArray data, final CallbackContext callbackContext)
	{
		Pushwoosh.getInstance().clearPushHistory();
		return true;
	}

	@CordovaMethod
	private boolean clearNotificationCenter(JSONArray data, final CallbackContext callbackContext)
	{
		NotificationManagerCompat.from(cordova.getActivity()).cancelAll();
		return true;
	}

	@CordovaMethod
	private boolean setApplicationIconBadgeNumber(JSONArray data, final CallbackContext callbackContext)
	{
		try
		{
			Integer badgeNumber = data.getJSONObject(0).getInt("badge");
			PushwooshBadge.setBadgeNumber(badgeNumber);
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
		Integer badgeNumber  = PushwooshBadge.getBadgeNumber();
		callbackContext.success(badgeNumber);
		return true;
	}

	@CordovaMethod
	private boolean addToApplicationIconBadgeNumber(JSONArray data, final CallbackContext callbackContext)
	{
		try
		{
			Integer badgeNumber = data.getJSONObject(0).getInt("badge");
			PushwooshBadge.addBadgeNumber(badgeNumber);
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
			PushwooshInApp.getInstance().setUserId(userId);
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
			PushwooshInApp.getInstance().postEvent(event, Tags.fromJson(attributes));
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
			String enabled = PushwooshNotificationSettings.areNotificationsEnabled() ? "1" : "0";
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

	@CordovaMethod
	private boolean presentInboxUI(JSONArray data, final CallbackContext callbackContext) {
		if (data.length() > 0)
			InboxUiStyleManager.setStyle(this.cordova.getActivity(), data.optJSONObject(0));
		this.cordova.getActivity().startActivity(new Intent(this.cordova.getActivity(), InboxActivity.class));
		return true;
	}

	@CordovaMethod
	public boolean showGDPRConsentUI(JSONArray data, final CallbackContext callbackContext){
		GDPRManager.getInstance().showGDPRConsentUI();
		return true;
	}

	@CordovaMethod
	public boolean showGDPRDeletionUI(JSONArray data, final CallbackContext callbackContext){
		GDPRManager.getInstance().showGDPRDeletionUI();
		return true;
	}

	@CordovaMethod
	public boolean isDeviceDataRemoved(JSONArray data, final CallbackContext callbackContext){
		boolean removed = GDPRManager.getInstance().isDeviceDataRemoved();
		callbackContext.success(removed ? 1 : 0);
		return true;
	}

	@CordovaMethod
	public boolean isCommunicationEnabled(JSONArray data, final CallbackContext callbackContext){
		boolean enabled = GDPRManager.getInstance().isCommunicationEnabled();
		callbackContext.success(enabled ? 1 : 0);
		return true;

	}

	@CordovaMethod
	public boolean isAvailableGDPR(JSONArray data, final CallbackContext callbackContext){
		boolean isAvailableGDPR = GDPRManager.getInstance().isAvailable();
		callbackContext.success(isAvailableGDPR ? 1 : 0);
		return true;
	}

	@CordovaMethod
	public boolean removeAllDeviceData(JSONArray data, final CallbackContext callbackContext){
		GDPRManager.getInstance().removeAllDeviceData(new Callback<Void, PushwooshException>() {
			@Override
			public void process(@NonNull Result<Void, PushwooshException> result) {
				if(result.isSuccess()){
					callbackContext.success();
				}else {
					callbackContext.error(result.getException().getMessage());
				}
			}
		});
		return true;
	}

	@CordovaMethod
	public boolean setCommunicationEnabled(JSONArray data, final CallbackContext callbackContext){
		try {
			boolean enable = data.getBoolean(0);
			GDPRManager.getInstance().setCommunicationEnabled(enable, new Callback<Void, PushwooshException>() {
				@Override
				public void process(@NonNull Result<Void, PushwooshException> result) {
					if(result.isSuccess()){
						callbackContext.success();
					}else {
						callbackContext.error(result.getException().getMessage());
					}
				}
			});
			return true;
		} catch (JSONException e) {
			e.printStackTrace();
		}
		return false;
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
		sStartPushData = null;
	}

	public void doOnPushReceived(String notification)
	{
		PWLog.debug(TAG, "push received: " + notification);

		String jsStatement = String.format("cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").pushReceivedCallback(%s);", convertNotification(notification));
		evalJs(jsStatement);

		sReceivedPushData = null;
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

		handler.post(new Runnable()
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


	static void openPush(String pushData) {
		try {
			synchronized (sStartPushLock) {
				sStartPushData = pushData;
				if (sAppReady.get() && sInstance != null) {
					sInstance.doOnPushOpened(pushData);
				}
			}
		} catch (Exception e) {
			// React Native is highly unstable
			PWLog.exception(e);
		}
	}

	static void messageReceived(String pushData) {
		try {
			synchronized (sStartPushLock) {
				sReceivedPushData = pushData;
				if (sAppReady.get() && sInstance != null) {
					sInstance.doOnPushReceived(pushData);
				}
			}
		} catch (Exception e) {
			// React Native is highly unstable
			PWLog.exception(e);
		}
	}


	public class JavascriptInterfaceCordova {
		@JavascriptInterface
		public void callFunction(String functionName) {
			String url = String.format("%s();", functionName);
			evalJs(url);
		}

		@JavascriptInterface
		public void callFunction(String functionName, String args) {
			String url;
			if (args == null || args.isEmpty()) {
				url = String.format("%s();", functionName);
			} else {
				url = String.format("%s(%s);", functionName, args);
			}
			evalJs(url);
		}
	}

	@CordovaMethod
	private boolean addJavaScriptInterface(JSONArray data, final CallbackContext callbackContext) {
		try {
			String name = data.getString(0);
			PushwooshInApp.getInstance().addJavascriptInterface(new JavascriptInterfaceCordova(), name);
		} catch (JSONException e) {
			PWLog.error(TAG, "No parameters has been passed to addJavaScriptInterface function. Did you follow the guide correctly?", e);
			return false;
		}

		return true;
	}

}
