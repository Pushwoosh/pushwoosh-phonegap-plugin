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
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

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
import java.util.Set;

/**
 * Push notifications manager
 */
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

	public static final String REGISTER_BROAD_CAST_ACTION = "com.arellomobile.android.push.REGISTER_BROAD_CAST_ACTION";

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

	/**
	 * Init push manager
	 *
	 * @param context
	 * @param appId Pushwoosh Application ID
	 * @param senderId ProjectID from Google GCM
	 */
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
	 * Must be called after initialization. Registers app with GCM and Pushwoosh if necessary. After registration calls {@link PushEventsTransmitter#onRegistered(Context, String) PushEventsTransmitter.onRegistered(Context context, String registrationId)}
	 *
	 * @param context current context
	 * @param registerAppOpen send service message that app has been opened (for stats)
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

	/**
	 * Starts tracking Geo Push Notifications
	 */
	public void startTrackingGeoPushes()
	{
		mContext.startService(new Intent(mContext, GeoLocationService.class));
	}

	/**
	 * Stop tracking Geo Push Notifications
	 */
	public void stopTrackingGeoPushes()
	{
		mContext.stopService(new Intent(mContext, GeoLocationService.class));
	}

	/**
	 * Unregister from push notifications
	 */
	public void unregister()
	{
		cancelPrevRegisterTask();

		GCMRegistrar.unregister(mContext);
	}

	/**
	 * Get push notification user data
	 *
	 * @return string user data, or null
	 */
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
	 * Send tags synchronously.
	 * WARNING!
	 * Be sure to call this method from working thread.
	 * If not, you will freeze UI or runtime exception on Android >= 3.0
	 *
	 * @param tags tags to send. Value can be String or Integer only - if not Exception will be thrown
	 * @return wrong tags. key is name of the tag
	 * @throws PushWooshException
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

	/**
	 * Send tags asynchronously from UI
	 *
	 * @param context
	 * @param tags tags to send. Value can be String or Integer only - if not Exception will be thrown
	 * @param callBack result callback
	 */
	@SuppressWarnings("unchecked")
	public static void sendTagsFromUI(Context context, Map<String, Object> tags, SendPushTagsCallBack callBack)
	{
		new SendPushTagsAsyncTask(context, callBack).execute(tags);
	}

	/**
	 * Send tags asynchronously
	 *
	 * @param context
	 * @param tags tags to send. Value can be String or Integer only - if not Exception will be thrown
	 * @param callBack execute result callback
	 */
	public static void sendTags(final Context context, final Map<String, Object> tags, final SendPushTagsCallBack callBack)
	{
		Handler handler = new Handler(context.getMainLooper());
		handler.post(new Runnable() {
			@SuppressWarnings("unchecked")
			public void run() { new SendPushTagsAsyncTask(context, callBack).execute(tags); }
		});
	}

	/**
	 * Get tags listener
	 */
	public interface GetTagsListener {
		/**
		 * Called when tags received
		 *
		 * @param tags received tags map
		 */
		public void onTagsReceived(Map<String, Object> tags);

		/**
		 * Called when request failed
		 *
		 * @param e Exception
		 */
		public void onError(Exception e);
	}

	/**
	 * Get tags from Pushwoosh service synchronously
	 *
	 * @param context
	 * @return tags, or null
	 */
	public static Map<String, Object> getTagsSync(final Context context)
	{
		if (GCMRegistrar.isRegisteredOnServer(context) == false)
			return null;
		
		return DeviceFeature2_5.getTags(context);
	}

	/**
	 * Get tags from Pushwoosh service asynchronously
	 *
	 * @param context
	 * @return tags, or null
	 */
	public static void getTagsAsync(final Context context, final GetTagsListener listener)
	{
		if (GCMRegistrar.isRegisteredOnServer(context) == false)
			return;
		
		Handler handler = new Handler(context.getMainLooper());
		handler.post(new Runnable() {
			public void run() {
				AsyncTask<Void, Void, Void> task = new WorkerTask(context)
				{
					@Override
					protected void doWork(Context context)
					{
						Map<String, Object> tags;
						try {
							tags = DeviceFeature2_5.getTags(context);
							listener.onTagsReceived(tags);
						} catch (Exception e) {
							listener.onError(e);
						}
					}
				};

				ExecutorHelper.executeAsyncTask(task);
			}
		});		
	}

	/**
	 * Send location to Pushwoosh service asynchronously
	 *
	 * @param context
	 * @param location
	 */
	public static void sendLocation(final Context context, final Location location)
	{
		if (GCMRegistrar.isRegisteredOnServer(context) == false)
			return;

		Handler handler = new Handler(context.getMainLooper());
		handler.post(new Runnable() {
			public void run() {
				AsyncTask<Void, Void, Void> task = new WorkerTask(context)
				{
					@Override
					protected void doWork(Context context)
					{
						try {
							DeviceFeature2_5.getNearestZone(context, location);
						} catch (Exception e) {
//								e.printStackTrace();
						}
					}
				};

				ExecutorHelper.executeAsyncTask(task);
			}
		});
	}

	//	------------------- 2.5 Features ENDS -------------------


	//	------------------- PREFERENCE STARTS -------------------

	/**
	 * Allows multiple notifications in notification bar.
	 *
	 * @param context
	 */
	public static void setMultiNotificationMode(Context context)
	{
		PreferenceUtils.setMultiMode(context, true);
	}

	/**
	 * Allows only the last notification in notification bar.
	 */
	public static void setSimpleNotificationMode(Context context)
	{
		PreferenceUtils.setMultiMode(context, false);
	}

	/**
	 * Change sound notification type
	 *
	 * @param context
	 * @param soundNotificationType target sound type
	 */
	public static void setSoundNotificationType(Context context, SoundType soundNotificationType)
	{
		PreferenceUtils.setSoundType(context, soundNotificationType);
	}

	/**
	 * Change vibration notification type
	 *
	 * @param context
	 * @param vibrateNotificationType target vibration type
	 */
	public static void setVibrateNotificationType(Context context, VibrateType vibrateNotificationType)
	{
		PreferenceUtils.setVibrateType(context, vibrateNotificationType);
	}

	/**
	 * Enable/disable screen light when notification message arrives
	 *
	 * @param context
	 * @param lightsOn
	 */
	public static void setLightScreenOnNotification(Context context, boolean lightsOn)
	{
		PreferenceUtils.setLightScreenOnNotification(context, lightsOn);
	}

	/**
	 * Enable/disable LED highlight when notification message arrives
	 *
	 * @param context
	 * @param ledOn
	 */
	public static void setEnableLED(Context context, boolean ledOn)
	{
		PreferenceUtils.setEnableLED(context, ledOn);
	}

	//	------------------- PREFERENCE END -------------------


	//	------------------- HANDLING PUSH MESSAGE STARTS -------------------

	/**
	 * Called during push message processing, processes push notifications payload. Used internally!
	 *
	 * @param activity that handles push notification
	 * @return false if activity doesn't have pushBundle, true otherwise
	 */
	boolean onHandlePush(Activity activity)
	{
		Bundle pushBundle = activity.getIntent().getBundleExtra("pushBundle");
		if (null == pushBundle || null == mContext)
		{
			return false;
		}

		mLastBundle = pushBundle;

		JSONObject dataObject = new JSONObject();
		Set<String> keys = pushBundle.keySet();
		for (String key : keys) {
			//backward compatibility
			if(key.equals("u"))
			{
				try
				{
					dataObject.put("userdata", pushBundle.get("u"));
				}
				catch (JSONException e)
				{
					// pass
				}
			}

			try
			{
				dataObject.put(key, pushBundle.get(key));
			}
			catch (JSONException e)
			{
				// pass
			}
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
		
		String customPageUrl = (String) pushBundle.get("r");
		if(customPageUrl != null) {
			// show browser
			Intent intent = new Intent(activity, PushWebview.class);
			intent.putExtra("url", customPageUrl);
			activity.startActivity(intent);
		}
		
		//temporary disable this code until the server supports it
		String packageName = (String) pushBundle.get("l");
		if(false && packageName != null)
		{
			Intent launchIntent = null;
			try
			{
				launchIntent = mContext.getPackageManager().getLaunchIntentForPackage(packageName);
			}
			catch(Exception e)
			{
			// if no application found
			}
			
			if(launchIntent != null)
			{
				activity.startActivity(launchIntent);
			}
			else
			{
				url = (String) pushBundle.get("al");
				if (url != null)
				{
					launchIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
					launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
					activity.startActivity(launchIntent);
				}
			}
		}


		// send pushwoosh callback
		sendPushStat(mContext, pushBundle.getString("p"));

		return true;
	}

	//	------------------- HANDLING PUSH MESSAGE END -------------------


	//	------------------- PRIVATE METHODS -------------------

	/**
	 * Check if we need to registrer on Pushwoosh
	 *
	 * @param context
	 * @return true if registered in last 10 min, false otherwise
	 */
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

	/**
	 * Registers on Pushwoosh service asynchronously
	 *
	 * @param context
	 * @param regId registration ID
	 */
	private void registerOnPushWoosh(final Context context, final String regId)
	{
		cancelPrevRegisterTask();

		Handler handler = new Handler(context.getMainLooper());
		handler.post(new Runnable() {
			public void run() {
				// if not register yet or an other id detected
				mRegistrationAsyncTask = getRegisterAsyncTask(context, regId);

				ExecutorHelper.executeAsyncTask(mRegistrationAsyncTask);
			}
		});
	}

	/**
	 * Sends push stat asynchronously
	 * @param context
	 * @param hash
	 */
	void sendPushStat(final Context context, final String hash)
	{
		Handler handler = new Handler(context.getMainLooper());
		handler.post(new Runnable() {
			public void run() {
				AsyncTask<Void, Void, Void> task = new WorkerTask(context)
				{
					@Override
					protected void doWork(Context context)
					{
						DeviceFeature2_5.sendPushStat(context, hash);
					}
				};

				ExecutorHelper.executeAsyncTask(task);
			}
		});
	}

	/**
	 * Sends service message that app has been opened
	 *
	 * @param context
	 */
	private void sendAppOpen(final Context context)
	{
		Handler handler = new Handler(context.getMainLooper());
		handler.post(new Runnable() {
			public void run() {
				AsyncTask<Void, Void, Void> task = new WorkerTask(context)
				{
					@Override
					protected void doWork(Context context)
					{
						DeviceFeature2_5.sendAppOpen(context);
					}
				};

				ExecutorHelper.executeAsyncTask(task);
			}
		});
	}

	/**
	 * Sends goal achieved asynchronously
	 *
	 * @param context
	 * @param goal
	 * @param count
	 */
	public static void sendGoalAchieved(final Context context, final String goal, final Integer count)
	{
		Handler handler = new Handler(context.getMainLooper());
		handler.post(new Runnable() {
			public void run() {
				AsyncTask<Void, Void, Void> task = new WorkerTask(context)
				{
					@Override
					protected void doWork(Context context)
					{
						DeviceFeature2_5.sendGoalAchieved(context, goal, count);
					}
				};

				ExecutorHelper.executeAsyncTask(task);
			}
		});
	}

	/**
	 * Gets asynchronous registration task
	 *
	 * @param context
	 * @param regId registration ID
	 * @return task that make registration asynchronously
	 */
	private AsyncTask<Void, Void, Void> getRegisterAsyncTask(final Context context, final String regId)
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

	/**
	 * Cancels previous registration task
	 */
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

	/**
	 * Schedules a local notification
	 * @param context
	 * @param message notification message
	 * @param seconds delay (in seconds) until the message will be sent
	 */
	static public void scheduleLocalNotification(Context context, String message, int seconds)
	{
		scheduleLocalNotification(context, message, null, seconds);
	}

	/**
	 * Schedules a local notification with extras
	 *
	 * Extras parameters:
	 * title - message title, same as message parameter
	 * l - link to open when notification has been tapped
	 * b - banner URL to show in the notification instead of text
	 * u - user data
	 * i - identifier string of the image from the app to use as the icon in the notification
	 * ci - URL of the icon to use in the notification
	 *
	 * @param context
	 * @param message notification message
	 * @param extras notification extras parameters
	 * @param seconds delay (in seconds) until the message will be sent
	 */
	static public void scheduleLocalNotification(Context context, String message, Bundle extras, int seconds)
	{
		AlarmReceiver.setAlarm(context, message, extras, seconds);
	}

	/**
	 * Removes all scheduled local notifications
	 * @param context
	 */
	static public void clearLocalNotifications(Context context) {
		AlarmReceiver.clearAlarm(context);
	}
	
	static public Map<String, Object> incrementalTag(Integer value) {
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("operation", "increment");
		result.put("value", value);
		
		return result;
	}
}
