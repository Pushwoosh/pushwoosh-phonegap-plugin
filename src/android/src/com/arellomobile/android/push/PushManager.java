//
//  PushManager.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed

package com.arellomobile.android.push;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;

import com.arellomobile.android.push.exception.PushWooshException;
import com.arellomobile.android.push.preference.SoundType;
import com.arellomobile.android.push.preference.VibrateType;
import com.arellomobile.android.push.tags.SendPushTagsAsyncTask;
import com.arellomobile.android.push.tags.SendPushTagsCallBack;
import com.arellomobile.android.push.utils.executor.ExecutorHelper;
import com.arellomobile.android.push.utils.GeneralUtils;
import com.arellomobile.android.push.utils.PreferenceUtils;
import com.arellomobile.android.push.utils.WorkerTask;
import com.google.android.gcm.GCMRegistrar;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class PushManager
{
	// app id in the backend
	private volatile String mAppId;
	volatile static String mSenderId;

	private static final String HTML_URL_FORMAT = "https://cp.pushwoosh.com/content/%s";

	public static final String REGISTER_EVENT = "REGISTER_EVENT";
	public static final String REGISTER_ERROR_EVENT = "REGISTER_ERROR_EVENT";
	public static final String UNREGISTER_EVENT = "UNREGISTER_EVENT";
	public static final String UNREGISTER_ERROR_EVENT = "UNREGISTER_ERROR_EVENT";
	public static final String PUSH_RECEIVE_EVENT = "PUSH_RECEIVE_EVENT";

	private Context mContext;
	private Bundle mLastBundle;

	Context getContext() {
		return mContext;
	}

	private static final Object mSyncObj = new Object();
	private static AsyncTask<Void, Void, Void> mRegistrationAsyncTask;

	PushManager(Context context)
	{
		GeneralUtils.checkNotNull(context, "context");
		mContext = context;
		mAppId = PreferenceUtils.getApplicationId(context);
		mSenderId = PreferenceUtils.getSenderId(context);
	}

	public PushManager(Context context, String appId, String senderId)
	{
		this(context);

		mAppId = appId;
		mSenderId = senderId;
		PreferenceUtils.setApplicationId(context, mAppId);
		PreferenceUtils.setSenderId(context, senderId);
	}
	
	public void onStartup(Context context)
	{
		onStartup(context, true);
	}

	/**
	 * @param context current context
	 */
	public void onStartup(Context context, boolean registerAppOpen)
	{
		GeneralUtils.checkNotNullOrEmpty(mAppId, "mAppId");
		GeneralUtils.checkNotNullOrEmpty(mSenderId, "mSenderId");

		// Make sure the device has the proper dependencies.
		GCMRegistrar.checkDevice(context);
		// Make sure the manifest was properly set - comment out this line
		// while developing the app, then uncomment it when it's ready.
		GCMRegistrar.checkManifest(context);
		
		if(registerAppOpen)
			sendAppOpen(context);

		final String regId = GCMRegistrar.getRegistrationId(context);
		if (regId.equals(""))
		{
			// Automatically registers application on startup.
			GCMRegistrar.register(context, mSenderId);
		}
		else
		{
			if (context instanceof Activity)
			{
				if (((Activity) context).getIntent().hasExtra(PushManager.PUSH_RECEIVE_EVENT))
				{
					// if this method calls because of push message, we don't need to register
					return;
				}
			}

			String oldAppId = PreferenceUtils.getApplicationId(context);

			if (!oldAppId.equals(mAppId))
			{
				registerOnPushWoosh(context, regId);
			}
			else
			{
				if (neededToRequestPushWooshServer(context))
				{
					registerOnPushWoosh(context, regId);
				}
				else
				{
					PushEventsTransmitter.onRegistered(context, regId);
				}
			}
		}
	}

	public void startTrackingGeoPushes()
	{
		mContext.startService(new Intent(mContext, GeoLocationService.class));
	}

	public void stopTrackingGeoPushes()
	{
		mContext.stopService(new Intent(mContext, GeoLocationService.class));
	}

	public void unregister()
	{
		cancelPrevRegisterTask();

		GCMRegistrar.unregister(mContext);
	}

	public String getCustomData()
	{
		if (mLastBundle == null)
		{
			return null;
		}

		return mLastBundle.getString("u");
	}

	//	------------------- 2.5 Features STARTS -------------------

	/**
	 * WARNING.
	 * Be sure you call this method from working thread.
	 * If not, you will have freeze UI or runtime exception on Android >= 3.0
	 *
	 * @param tags - tags to sent. Value can be String or Integer only - if not Exception will be thrown
	 * @return map of wrong tags. key is name of the tag
	 */
	public static Map<String, String> sendTagsFromBG(Context context, Map<String, Object> tags)
			throws PushWooshException
	{
		Map<String, String> wrongTags = new HashMap<String, String>();

		try
		{
			JSONArray wrongTagsArray = DeviceFeature2_5.sendTags(context, tags);

			for (int i = 0; i < wrongTagsArray.length(); ++i)
			{
				JSONObject reason = wrongTagsArray.getJSONObject(i);
				wrongTags.put(reason.getString("tag"), reason.getString("reason"));
			}
		}
		catch (Exception e)
		{
			throw new PushWooshException(e);
		}


		return wrongTags;
	}

	@SuppressWarnings("unchecked")
	public static void sendTagsFromUI(Context context, Map<String, Object> tags, SendPushTagsCallBack callBack)
	{
		new SendPushTagsAsyncTask(context, callBack).execute(tags);
	}

	public static void sendTags(final Context context, final Map<String, Object> tags, final SendPushTagsCallBack callBack)
	{
		Handler handler = new Handler(context.getMainLooper());
		handler.post(new Runnable() {
			@SuppressWarnings("unchecked")
			public void run() { new SendPushTagsAsyncTask(context, callBack).execute(tags); }
		});
	}
	
	public static void sendLocation(Context context, final Location location)
	{
		if (GCMRegistrar.isRegisteredOnServer(context) == false)
			return;

		AsyncTask<Void, Void, Void> task;
		try
		{
			task = new WorkerTask(context)
			{
				@Override
				protected void doWork(Context context)
				{
					try {
						DeviceFeature2_5.getNearestZone(context, location);
					} catch (Exception e) {
//						e.printStackTrace();
					}
				}
			};
		}
		catch (Throwable e)
		{
			// we are not in UI thread. Simple run our registration
			try {
				DeviceFeature2_5.getNearestZone(context, location);
			} catch (Exception e1) {
//				e1.printStackTrace();
			}
			return;
		}
		ExecutorHelper.executeAsyncTask(task);
	}

	//	------------------- 2.5 Features ENDS -------------------


	//	------------------- PREFERENCE STARTS -------------------

	/**
	 * Note this will take affect only after PushGCMIntentService restart if it is already running
	 */
	public void setMultiNotificationMode()
	{
		PreferenceUtils.setMultiMode(mContext, true);
	}

	/**
	 * Note this will take affect only after PushGCMIntentService restart if it is already running
	 */
	public void setSimpleNotificationMode()
	{
		PreferenceUtils.setMultiMode(mContext, false);
	}

	public void setSoundNotificationType(SoundType soundNotificationType)
	{
		PreferenceUtils.setSoundType(mContext, soundNotificationType);
	}

	public void setVibrateNotificationType(VibrateType vibrateNotificationType)
	{
		PreferenceUtils.setVibrateType(mContext, vibrateNotificationType);
	}

	//	------------------- PREFERENCE END -------------------


	//	------------------- HANDLING PUSH MESSAGE STARTS -------------------

	boolean onHandlePush(Activity activity)
	{
		Bundle pushBundle = activity.getIntent().getBundleExtra("pushBundle");
		if (null == pushBundle || null == mContext)
		{
			return false;
		}

		mLastBundle = pushBundle;

		JSONObject dataObject = new JSONObject();
		try
		{
			if (pushBundle.containsKey("title"))
			{
				dataObject.put("title", pushBundle.get("title"));
			}
			if (pushBundle.containsKey("u"))
			{
				dataObject.put("userdata", pushBundle.get("u"));
			}
			if (pushBundle.containsKey("local"))
			{
				dataObject.put("local", pushBundle.get("local"));
			}
		}
		catch (JSONException e)
		{
			// pass
		}

		PushEventsTransmitter.onMessageReceive(mContext, dataObject.toString(), pushBundle);

		// push message handling
		String url = (String) pushBundle.get("h");

		if (url != null)
		{
			url = String.format(HTML_URL_FORMAT, url);

			// show browser
			Intent intent = new Intent(activity, PushWebview.class);
			intent.putExtra("url", url);
			activity.startActivity(intent);
		}

		// send pushwoosh callback
		sendPushStat(mContext, pushBundle.getString("p"));

		return true;
	}

	//	------------------- HANDLING PUSH MESSAGE END -------------------


	//	------------------- PRIVATE METHODS -------------------

	private boolean neededToRequestPushWooshServer(Context context)
	{
		Calendar nowTime = Calendar.getInstance();
		Calendar tenMinutesBefore = Calendar.getInstance();
		tenMinutesBefore.add(Calendar.MINUTE, -10); // decrement 10 minutes

		Calendar lastPushWooshRegistrationTime = Calendar.getInstance();
		lastPushWooshRegistrationTime.setTime(new Date(PreferenceUtils.getLastRegistration(context)));

		if (tenMinutesBefore.before(lastPushWooshRegistrationTime) && lastPushWooshRegistrationTime.before(nowTime))
		{
			// tenMinutesBefore <= lastPushWooshRegistrationTime <= nowTime
			return false;
		}
		return true;
	}

	private void registerOnPushWoosh(Context context, String regId)
	{
		cancelPrevRegisterTask();

		// if not register yet or an other id detected
		mRegistrationAsyncTask = getRegisterAsyncTask(context, regId);
		ExecutorHelper.executeAsyncTask(mRegistrationAsyncTask);
	}

	void sendPushStat(Context context, final String hash)
	{
		AsyncTask<Void, Void, Void> task;
		try
		{
			task = new WorkerTask(context)
			{
				@Override
				protected void doWork(Context context)
				{
					DeviceFeature2_5.sendPushStat(context, hash);
				}
			};
		}
		catch (Throwable e)
		{
			// we are not in UI thread. Simple run our registration
			DeviceFeature2_5.sendPushStat(context, hash);
			return;
		}
		ExecutorHelper.executeAsyncTask(task);
	}
	
	private void sendAppOpen(Context context)
	{
		if (GCMRegistrar.isRegisteredOnServer(context) == false)
			return;

		AsyncTask<Void, Void, Void> task;
		try
		{
			task = new WorkerTask(context)
			{
				@Override
				protected void doWork(Context context)
				{
					DeviceFeature2_5.sendAppOpen(context);
				}
			};
		}
		catch (Throwable e)
		{
			// we are not in UI thread. Simple run our registration
			DeviceFeature2_5.sendAppOpen(context);
			return;
		}
		ExecutorHelper.executeAsyncTask(task);
	}

	private AsyncTask<Void, Void, Void> getRegisterAsyncTask(final Context context, final String regId)
	{
		try
		{
			return new WorkerTask(context)
			{
				@Override
				protected void doWork(Context context)
				{
					DeviceRegistrar.registerWithServer(mContext, regId);
				}
			};
		}
		catch (Throwable e)
		{
			// we are not in UI thread. Simple run our registration
			DeviceRegistrar.registerWithServer(context, regId);
			return null;
		}
	}

	private void cancelPrevRegisterTask()
	{
		synchronized (mSyncObj)
		{
			if (null != mRegistrationAsyncTask)
			{
				mRegistrationAsyncTask.cancel(true);
			}
			mRegistrationAsyncTask = null;
		}
	}
	
	static public void scheduleLocalNotification(Context context, String message, int seconds)
	{
		scheduleLocalNotification(context, message, null, seconds);
	}
	
    //extras parameters:
    //title - message title, same as message parameter
    //l - link to open when notification has been tapped
    //b - banner URL to show in the notification instead of text
    //u - user data
    //i - identifier string of the image from the app to use as the icon in the notification
    //ci - URL of the icon to use in the notification
	static public void scheduleLocalNotification(Context context, String message, Bundle extras, int seconds)
	{
		AlarmReceiver.setAlarm(context, message, extras, seconds);
	}

	static public void clearLocalNotifications(Context context) {
		AlarmReceiver.clearAlarm(context);
	}
}
