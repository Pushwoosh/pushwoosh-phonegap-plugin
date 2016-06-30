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
import android.location.Location;
import android.os.Bundle;
import android.util.Log;
import android.Manifest;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;

import com.pushwoosh.PushManager;
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
import org.apache.cordova.PermissionHelper;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.PluginResult;
import org.apache.cordova.LOG;
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
	public static final String CREATE_LOCAL_NOTIFICATION = "createLocalNotification";
	public static final String CLEAR_LOCAL_NOTIFICATION = "clearLocalNotification";
	public static final String GET_TAGS = "getTags";
	public static final String ON_DEVICE_READY = "onDeviceReady";
	public static final String GET_PUSH_TOKEN = "getPushToken";
	public static final String GET_HWID = "getPushwooshHWID";
	public static final String GET_LAUNCH_NOTIFICATION = "getLaunchNotification";

    CallbackContext context;
    
    String [] permissions = { Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION };

	boolean receiversRegistered = false;
	boolean broadcastPush = true;
	JSONObject startPushData = null;

	HashMap<String, CallbackContext> callbackIds = new HashMap<String, CallbackContext>();
	PushManager mPushManager = null;

	private String TAG = "PWCordovaPlugin";

	/**
	 * Called when the activity receives a new intent.
	 */
    
    
    public void onRequestPermissionResult(int requestCode, String[] permissions,
                                          int[] grantResults) throws JSONException
    {
        PluginResult result;
        //This is important if we're using Cordova without using Cordova, but we have the geolocation plugin installed
        if(context != null) {
            for (int r : grantResults) {
                if (r == PackageManager.PERMISSION_DENIED) {
                    LOG.d(TAG, "Permission Denied!");
                    result = new PluginResult(PluginResult.Status.ILLEGAL_ACCESS_EXCEPTION);
                    context.sendPluginResult(result);
                    return;
                }

            }
            result = new PluginResult(PluginResult.Status.OK);
            context.sendPluginResult(result);
        }
    }

    public boolean hasPermisssion() {
        for(String p : permissions)
        {
            if(!PermissionHelper.hasPermission(this, p))
            {
                return false;
            }
        }
        return true;
    }

    /*
     * We override this so that we can access the permissions variable, which no longer exists in
     * the parent class, since we can't initialize it reliably in the constructor!
     */

    public void requestPermissions(int requestCode)
    {
        PermissionHelper.requestPermissions(this, requestCode, permissions);
    }
    
	public void onNewIntent(Intent intent)
	{
		super.onNewIntent(intent);

		startPushData = getPushFromIntent(intent);
		checkMessage(intent);
	}

	BroadcastReceiver mBroadcastReceiver = new BaseRegistrationReceiver()
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
		if (broadcastPush)
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
			Log.e(TAG, "No parameters has been passed to onDeviceReady function. Did you follow the guide correctly?");
			return;
		}

		try
		{
			String packageName = cordova.getActivity().getApplicationContext().getPackageName();
			ApplicationInfo ai = cordova.getActivity().getPackageManager().getApplicationInfo(packageName, PackageManager.GET_META_DATA);
			
			if (ai.metaData != null && ai.metaData.containsKey("PW_NO_BROADCAST_PUSH"))
				broadcastPush = !(ai.metaData.getBoolean("PW_NO_BROADCAST_PUSH"));

			Log.d(TAG, "broadcastPush = " + broadcastPush);
		}
		catch (Exception e)
		{
			e.printStackTrace();
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
			e.printStackTrace();
			Log.e("Pushwoosh", "Missing pw_appid parameter. Did you follow the guide correctly?");
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
			Log.e("Pushwoosh", "registering for push notifications failed");

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
				e.printStackTrace();
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
			Log.e("Pushwoosh", "No tags information passed (missing parameters)");
			e.printStackTrace();
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
				Log.e("Pushwoosh", "Tag parameter is invalid");
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
		Log.d(TAG, "Plugin Method Called: " + action);
        context = callbackId;
        
        if(hasPermisssion())
            {
                PluginResult r = new PluginResult(PluginResult.Status.OK);
                context.sendPluginResult(r);
                return true;
            }
            else {
                PermissionHelper.requestPermissions(this, 0, permissions);
            }

		Log.d(TAG, "Invalid action : " + action + " passed");
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
		Log.e(TAG, "message is: " + message);
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

	private BroadcastReceiver mReceiver = new BasePushMessageReceiver()
	{
		@Override
		protected void onMessageReceive(Intent intent)
		{
			doOnMessageReceive(intent.getStringExtra(JSON_DATA_KEY));
		}
	};
}
