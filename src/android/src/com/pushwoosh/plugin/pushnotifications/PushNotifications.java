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
import androidx.annotation.NonNull;
import androidx.core.app.NotificationManagerCompat;
import android.webkit.JavascriptInterface;

import com.pushwoosh.GDPRManager;
import com.pushwoosh.Pushwoosh;
import com.pushwoosh.RegisterForPushNotificationsResultData;
import com.pushwoosh.badge.PushwooshBadge;
import com.pushwoosh.exception.GetTagsException;
import com.pushwoosh.exception.PushwooshException;
import com.pushwoosh.exception.RegisterForPushNotificationsException;
import com.pushwoosh.exception.UnregisterForPushNotificationException;
import com.pushwoosh.function.Callback;
import com.pushwoosh.function.Result;
import com.pushwoosh.inapp.PushwooshInApp;
import com.pushwoosh.inbox.PushwooshInbox;
import com.pushwoosh.inbox.data.InboxMessage;
import com.pushwoosh.inbox.exception.InboxMessagesException;
import com.pushwoosh.inbox.ui.presentation.view.activity.InboxActivity;
import com.pushwoosh.internal.platform.utils.GeneralUtils;
import com.pushwoosh.internal.utils.JsonUtils;
import com.pushwoosh.internal.utils.PWLog;
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
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.annotation.Retention;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
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
		if (null == intent) {
			return null;
		}

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
	private boolean additionalAuthorizationOptions(JSONArray data, CallbackContext callbackContext) {
		// Stub, this is iOS only method
		return true;
	}

	@CordovaMethod
	private boolean registerDevice(JSONArray data, CallbackContext callbackContext) {
		try {
			callbackIds.put("registerDevice", callbackContext);
			Pushwoosh.getInstance().registerForPushNotifications(new Callback<RegisterForPushNotificationsResultData, RegisterForPushNotificationsException>() {
				@Override
				public void process(@NonNull final Result<RegisterForPushNotificationsResultData, RegisterForPushNotificationsException> result) {
					if (result.isSuccess() && result.getData() != null) {
						doOnRegistered(result.getData().getToken());
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
	private boolean setLanguage(JSONArray data, final CallbackContext callbackContext) {
		try {
			String language = data.getString(0);
			Pushwoosh.getInstance().setLanguage(language);
		} catch (JSONException e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
		}
		return true;
	}

	@CordovaMethod
	private boolean setShowPushnotificationAlert(JSONArray data, final CallbackContext callbackContext) {
		try {
			boolean showAlert = data.getBoolean(0);
			Pushwoosh.getInstance().setShowPushnotificationAlert(showAlert);
		} catch (JSONException e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
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

				if(result.isSuccess()) {
					callback.success(new JSONObject());
				} else if(result.getException()!=null) {
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
				if (callback == null) {
					return;
				}

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
	private boolean createLocalNotification(JSONArray data, final CallbackContext callbackContext) {
		JSONObject params = null;
		try {
			params = data.getJSONObject(0);
		} catch (JSONException e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
			return false;
		}

		try {
			//config params: {msg:"message", seconds:30, userData:"optional"}
			String message = params.getString("msg");
			int seconds = params.getInt("seconds");
			if (message == null) {
				return false;
			}

			Bundle extras = new Bundle();
			if (params.has("userData")) {
				extras.putString("u", params.getString("userData"));
			}

			LocalNotification notification = new LocalNotification.Builder()
					.setMessage(message)
					.setDelay(seconds)
					.setExtras(extras)
					.build();
			Pushwoosh.getInstance().scheduleLocalNotification(notification);
		} catch (JSONException e) {
			PWLog.error(TAG, "Not correct parameters passed (missing parameters)", e);
			return false;
		}

		return true;
	}

	@CordovaMethod
	private boolean clearLocalNotification(JSONArray data, final CallbackContext callbackContext) {
		LocalNotificationReceiver.cancelAll();
		return true;
	}

	@CordovaMethod
	private boolean getLaunchNotification(JSONArray data, final CallbackContext callbackContext) {
		PushMessage launchNotification = Pushwoosh.getInstance().getLaunchNotification();
		if (launchNotification == null) {
			callbackContext.success((String) null);
		} else {
			callbackContext.success(launchNotification.toJson().toString());
		}
		return true;
	}

	@CordovaMethod
	private boolean clearLaunchNotification(JSONArray data, final CallbackContext callbackContext) {
		Pushwoosh.getInstance().clearLaunchNotification();
		return true;
	}

	@CordovaMethod
	private boolean setMultiNotificationMode(JSONArray data, final CallbackContext callbackContext) {
		PushwooshNotificationSettings.setMultiNotificationMode(true);
		return true;
	}

	@CordovaMethod
	private boolean setSingleNotificationMode(JSONArray data, final CallbackContext callbackContext) {
		PushwooshNotificationSettings.setMultiNotificationMode(false);
		return true;
	}

	@CordovaMethod
	private boolean setSoundType(JSONArray data, final CallbackContext callbackContext) {
		try {
			Integer type = (Integer) data.get(0);
			if (type == null) {
				return false;
			}

			PushwooshNotificationSettings.setSoundNotificationType(SoundType.fromInt(type));
		} catch (Exception e) {
			PWLog.error(TAG, "No sound parameters passed (missing parameters)", e);
			return false;
		}

		return true;
	}

	@CordovaMethod
	private boolean setVibrateType(JSONArray data, final CallbackContext callbackContext) {
		try {
			Integer type = (Integer) data.get(0);
			if (type == null) {
				return false;
			}

			PushwooshNotificationSettings.setVibrateNotificationType(VibrateType.fromInt(type));
		} catch (Exception e) {
			PWLog.error(TAG, "No vibration parameters passed (missing parameters)", e);
			return false;
		}

		return true;
	}

	@CordovaMethod
	private boolean setLightScreenOnNotification(JSONArray data, final CallbackContext callbackContext) {
		try {
			boolean type = (boolean) data.getBoolean(0);
			PushwooshNotificationSettings.setLightScreenOnNotification(type);
		} catch (Exception e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
			return false;
		}

		return true;
	}

	@CordovaMethod
	private boolean setEnableLED(JSONArray data, final CallbackContext callbackContext) {
		try {
			boolean type = (boolean) data.getBoolean(0);
			PushwooshNotificationSettings.setEnableLED(type);
		} catch (Exception e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
			return false;
		}

		return true;
	}

	@CordovaMethod
	private boolean setColorLED(JSONArray data, final CallbackContext callbackContext) {
		try {
			String colorString = (String) data.get(0);
			if (colorString == null) {
				return false;
			}

			int colorLed = GeneralUtils.parseColor(colorString);
			PushwooshNotificationSettings.setColorLED(colorLed);
		} catch (Exception e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
			return false;
		}

		return true;
	}

	@CordovaMethod
	private boolean getPushHistory(JSONArray data, final CallbackContext callbackContext) {
		List<PushMessage> pushMessageHistory = Pushwoosh.getInstance().getPushHistory();
		List<String> pushHistory = new ArrayList<String>();

		for (PushMessage pushMessage: pushMessageHistory) {
			pushHistory.add(pushMessage.toJson().toString());
		}
		callbackContext.success(new JSONArray(pushHistory));
		return true;
	}

	@CordovaMethod
	private boolean clearPushHistory(JSONArray data, final CallbackContext callbackContext) {
		Pushwoosh.getInstance().clearPushHistory();
		return true;
	}

	@CordovaMethod
	private boolean clearNotificationCenter(JSONArray data, final CallbackContext callbackContext) {
		NotificationManagerCompat.from(cordova.getActivity()).cancelAll();
		return true;
	}

	@CordovaMethod
	private boolean setApplicationIconBadgeNumber(JSONArray data, final CallbackContext callbackContext) {
		try {
			Integer badgeNumber = data.getJSONObject(0).getInt("badge");
			PushwooshBadge.setBadgeNumber(badgeNumber);
		} catch (JSONException e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
			return false;
		}
		return true;
	}

	@CordovaMethod
	private boolean getApplicationIconBadgeNumber(JSONArray data, final CallbackContext callbackContext) {
		Integer badgeNumber  = PushwooshBadge.getBadgeNumber();
		callbackContext.success(badgeNumber);
		return true;
	}

	@CordovaMethod
	private boolean addToApplicationIconBadgeNumber(JSONArray data, final CallbackContext callbackContext) {
		try	{
			Integer badgeNumber = data.getJSONObject(0).getInt("badge");
			PushwooshBadge.addBadgeNumber(badgeNumber);
		} catch (JSONException e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
			return false;
		}
		return true;
	}

	@CordovaMethod
	private boolean setUserId(JSONArray data, final CallbackContext callbackContext) {
		try	{
			String userId = data.getString(0);
			PushwooshInApp.getInstance().setUserId(userId);
		} catch (JSONException e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
		}
		return true;
	}

	@CordovaMethod
	private boolean postEvent(JSONArray data, final CallbackContext callbackContext) {
		try	{
			String event = data.getString(0);
			JSONObject attributes = data.getJSONObject(1);
			PushwooshInApp.getInstance().postEvent(event, Tags.fromJson(attributes));
		} catch (JSONException e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
		}
		return true;
	}

	@CordovaMethod
	private boolean getRemoteNotificationStatus(JSONArray data, final CallbackContext callbackContext) {
		try {
			String enabled = PushwooshNotificationSettings.areNotificationsEnabled() ? "1" : "0";
			JSONObject result = new JSONObject();
			result.put("enabled", enabled);
			callbackContext.success(result);
		} catch (Exception e) {
			callbackContext.error(e.getMessage());
		}
		return true;
	}

	@CordovaMethod
	private boolean presentInboxUI(JSONArray data, final CallbackContext callbackContext) {
		if (data.length() > 0) {
			InboxUiStyleManager.setStyle(this.cordova.getActivity(), data.optJSONObject(0));
		}
		this.cordova.getActivity().startActivity(new Intent(this.cordova.getActivity(), InboxActivity.class));
		return true;
	}

	@CordovaMethod
	private boolean loadMessages(JSONArray data, final CallbackContext callbackContext) {
		try {
			callbackIds.put("loadMessages", callbackContext);
			PushwooshInbox.loadMessages(new Callback<Collection<InboxMessage>, InboxMessagesException>() {
				@Override
				public void process(@NonNull Result<Collection<InboxMessage>, InboxMessagesException> result) {
					CallbackContext callback = callbackIds.get("loadMessages");
					if (callback == null) {
						return;
					}

					if(result.isSuccess() && result.getData() != null) {
						ArrayList<InboxMessage> messagesList = new ArrayList<>(result.getData());
						JSONArray jsonArray = new JSONArray();
						for (InboxMessage message : messagesList) {
							jsonArray.put(inboxMessageToJson(message));
						}
						callback.success(jsonArray);
					} else if (result.getException() != null) {
						callback.error(result.getException().getMessage());
					}
				}
			});
		} catch (java.lang.RuntimeException e) {
			callbackIds.remove("loadMessages");
			PWLog.error(TAG, "Failed to load inbox messages", e);

			callbackContext.error(e.getMessage());
		}

		return true;
	}

	@CordovaMethod
	public boolean messagesWithNoActionPerformedCount(JSONArray data, final CallbackContext callbackContext) {
		try {
			callbackIds.put("messagesWithNoActionPerformedCount", callbackContext);
			PushwooshInbox.messagesWithNoActionPerformedCount(new Callback<Integer, InboxMessagesException>() {
				@Override
				public void process(@NonNull Result<Integer, InboxMessagesException> result) {
					CallbackContext callback = callbackIds.get("messagesWithNoActionPerformedCount");
					if (callback == null) {
						return;
					}

					if(result.isSuccess() && result.getData() != null) {
						callback.success(result.getData());
					} else if (result.getException() != null) {
						callback.error(result.getException().getMessage());
					}
				}
			});
		} catch (java.lang.RuntimeException e) {
			callbackIds.remove("messagesWithNoActionPerformedCount");
			PWLog.error(TAG, "Failed to get number of messages with no action", e);

			callbackContext.error(e.getMessage());
		}

		return true;
	}

	@CordovaMethod
	public boolean unreadMessagesCount(JSONArray data, final CallbackContext callbackContext) {
		try {
			callbackIds.put("unreadMessagesCount", callbackContext);
			PushwooshInbox.unreadMessagesCount(new Callback<Integer, InboxMessagesException>() {
				@Override
				public void process(@NonNull Result<Integer, InboxMessagesException> result) {
					CallbackContext callback = callbackIds.get("unreadMessagesCount");
					if (callback == null) {
						return;
					}

					if(result.isSuccess() && result.getData() != null) {
						callback.success(result.getData());
					} else if (result.getException() != null) {
						callback.error(result.getException().getMessage());
					}
				}
			});
		} catch (java.lang.RuntimeException e) {
			callbackIds.remove(" unreadMessagesCount");
			PWLog.error(TAG, "Failed to get number of unread messages", e);

			callbackContext.error(e.getMessage());
		}

		return true;
	}

	@CordovaMethod
	public boolean messagesCount(JSONArray data, final CallbackContext callbackContext) {
		try {
			callbackIds.put("messagesCount", callbackContext);
			PushwooshInbox.messagesCount(new Callback<Integer, InboxMessagesException>() {
				@Override
				public void process(@NonNull Result<Integer, InboxMessagesException> result) {
					CallbackContext callback = callbackIds.get("messagesCount");
					if (callback == null) {
						return;
					}

					if(result.isSuccess() && result.getData() != null) {
						callback.success(result.getData());
					} else if (result.getException() != null) {
						callback.error(result.getException().getMessage());
					}
				}
			});
		} catch (java.lang.RuntimeException e) {
			callbackIds.remove(" messagesCount");
			PWLog.error(TAG, "Failed to get total number of inbox messages", e);

			callbackContext.error(e.getMessage());
		}

		return true;
	}

	@CordovaMethod
	public boolean readMessage(JSONArray data, final CallbackContext callbackContext) {
		try {
			PushwooshInbox.readMessage(data.getString(0));
			return true;
		} catch (JSONException e) {
			PWLog.error(TAG, "Failed to mark inbox message as read", e);
			return false;
		}
	}

	@CordovaMethod
	public boolean deleteMessage(JSONArray data, final CallbackContext callbackContext) {
		try {
			PushwooshInbox.deleteMessage(data.getString(0));
			return true;
		} catch (JSONException e) {
			PWLog.error(TAG, "Failed to delete inbox message", e);
			return false;
		}
	}

	@CordovaMethod
	public boolean performAction(JSONArray data, final CallbackContext callbackContext) {
		try {
			PushwooshInbox.performAction(data.getString(0));
			return true;
		} catch (JSONException e) {
			PWLog.error(TAG, "Failed to perform action for inbox message", e);
			return false;
		}
	}

	@CordovaMethod
	public boolean showGDPRConsentUI(JSONArray data, final CallbackContext callbackContext) {
		GDPRManager.getInstance().showGDPRConsentUI();
		return true;
	}

	@CordovaMethod
	public boolean showGDPRDeletionUI(JSONArray data, final CallbackContext callbackContext) {
		GDPRManager.getInstance().showGDPRDeletionUI();
		return true;
	}

	@CordovaMethod
	public boolean isDeviceDataRemoved(JSONArray data, final CallbackContext callbackContext) {
		boolean removed = GDPRManager.getInstance().isDeviceDataRemoved();
		callbackContext.success(removed ? 1 : 0);
		return true;
	}

	@CordovaMethod
	public boolean isCommunicationEnabled(JSONArray data, final CallbackContext callbackContext) {
		boolean enabled = GDPRManager.getInstance().isCommunicationEnabled();
		callbackContext.success(enabled ? 1 : 0);
		return true;

	}

	@CordovaMethod
	public boolean isAvailableGDPR(JSONArray data, final CallbackContext callbackContext) {
		boolean isAvailableGDPR = GDPRManager.getInstance().isAvailable();
		callbackContext.success(isAvailableGDPR ? 1 : 0);
		return true;
	}

	@CordovaMethod
	public boolean removeAllDeviceData(JSONArray data, final CallbackContext callbackContext) {
		GDPRManager.getInstance().removeAllDeviceData(new Callback<Void, PushwooshException>() {
			@Override
			public void process(@NonNull Result<Void, PushwooshException> result) {
				if(result.isSuccess()) {
					callbackContext.success();
				}else {
					callbackContext.error(result.getException().getMessage());
				}
			}
		});
		return true;
	}

	@CordovaMethod
	public boolean setCommunicationEnabled(JSONArray data, final CallbackContext callbackContext) {
		try {
			boolean enable = data.getBoolean(0);
			GDPRManager.getInstance().setCommunicationEnabled(enable, new Callback<Void, PushwooshException>() {
				@Override
				public void process(@NonNull Result<Void, PushwooshException> result) {
					if(result.isSuccess()) {
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

	@CordovaMethod
	public boolean setEmail(JSONArray data, final CallbackContext callbackContext) {
		try {
			String email = data.getString(0);
			Pushwoosh.getInstance().setEmail(email, result -> {
				if (result.isSuccess()) {
					callbackContext.success();
				} else {
					callbackContext.error("Failed to set email");
				}
			});
		} catch (Exception e) {
			PWLog.error(TAG, "No parameters passed to setEmail (missing parameters)", e);
			callbackContext.error(e.getMessage());
		}
		return true;
	}

	@CordovaMethod
	public boolean setEmails(JSONArray data, final CallbackContext callbackContext) {
		try {
			JSONArray emailsArray = data.getJSONArray(0);
			List<String> emails = new ArrayList<>(emailsArray.length());
			for (int i = 0; i < emailsArray.length(); i++) {
				emails.add(emailsArray.getString(i));
			}
			Pushwoosh.getInstance().setEmail(emails, result -> {
				if (result.isSuccess()) {
					callbackContext.success();
				} else {
					callbackContext.error("Failed to set emails");
				}
			});
		} catch (Exception e) {
			PWLog.error(TAG, "No parameters passed to setEmails (missing parameters)", e);
			callbackContext.error(e.getMessage());
		}
		return true;
	}

	@CordovaMethod
	public boolean setUserEmails(JSONArray data, final CallbackContext callbackContext) {
		try {
			String userId = data.getString(0);
			JSONArray emailsArray = data.getJSONArray(1);
			List<String> emails = new ArrayList<>(emailsArray.length());
			for (int i = 0; i < emailsArray.length(); i++) {
				emails.add(emailsArray.getString(i));
			}
			
			Pushwoosh.getInstance().setUser(userId, emails, result -> {
				if (result.isSuccess()) {
					callbackContext.success();
				} else {
					callbackContext.error("Failed to set user emails");
				}
			});
		} catch (Exception e) {
			PWLog.error(TAG, "No parameters passed to setUserEmails (missing parameters)", e);
			callbackContext.error(e.getMessage());
		}
		return true;
	}

	@CordovaMethod
	private boolean registerSMSNumber(JSONArray data, final CallbackContext callbackContext) {
		try {
			String phoneNumber = data.getString(0);
			Pushwoosh.getInstance().registerSMSNumber(phoneNumber);
		} catch (Exception e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
			callbackContext.error(e.getMessage());
		}
		return true;
	}

	@CordovaMethod
	private boolean registerWhatsappNumber(JSONArray data, final CallbackContext callbackContext) {
		try {
			String phoneNumber = data.getString(0);
			Pushwoosh.getInstance().registerWhatsappNumber(phoneNumber);
		} catch (Exception e) {
			PWLog.error(TAG, "No parameters passed (missing parameters)", e);
			callbackContext.error(e.getMessage());
		}
		return true;
	}

	@CordovaMethod
	public boolean enableHuaweiPushNotifications(JSONArray data, final CallbackContext callbackContext) {
		Pushwoosh.getInstance().enableHuaweiPushNotifications();
		return true;
	}

	@Override
	public boolean execute(String action, JSONArray data, CallbackContext callbackId) {
		PWLog.debug(TAG, "Plugin Method Called: " + action);

		Method method = exportedMethods.get(action);
		if (method == null) {
			PWLog.debug(TAG, "Invalid action : " + action + " passed");
			return false;
		}

		try {
			Boolean result = (Boolean) method.invoke(this, data, callbackId);
			return result;
		}
		catch (Exception e) {
			PWLog.error(TAG, "Failed to execute action : " + action, e);
			return false;
		}
	}

	private void doOnRegistered(String registrationId) {
		CallbackContext callback = callbackIds.get("registerDevice");
		if (callback == null) {
			return;
		}

		try	{
			JSONObject result = new JSONObject();
			result.put("pushToken", registrationId);
			callback.success(result);
		} catch (Exception e) {
			callback.error("Internal error");
		}

		callbackIds.remove("registerDevice");
	}

	private void doOnRegisteredError(String errorId) {
		CallbackContext callback = callbackIds.get("registerDevice");
		if (callback == null) {
			return;
		}

		callback.error(errorId);
		callbackIds.remove("registerDevice");
	}

	private void doOnUnregistered(String registrationId) {
		CallbackContext callback = callbackIds.get("unregisterDevice");
		if (callback == null) {
			return;
		}

		callback.success(registrationId);
		callbackIds.remove("unregisterDevice");
	}

	private void doOnUnregisteredError(String errorId) {
		CallbackContext callback = callbackIds.get("unregisterDevice");
		if (callback == null) {
			return;
		}

		callback.error(errorId);
		callbackIds.remove("unregisterDevice");
	}

	private void doOnPushOpened(String notification) {
		PWLog.debug(TAG, "push opened: " + notification);

		String jsStatement = String.format("cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").notificationCallback(%s);", convertNotification(notification));
		evalJs(jsStatement);
		sStartPushData = null;
	}

	public void doOnPushReceived(String notification) {
		PWLog.debug(TAG, "push received: " + notification);

		String jsStatement = String.format("cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").pushReceivedCallback(%s);", convertNotification(notification));
		evalJs(jsStatement);

		sReceivedPushData = null;
	}

	private String convertNotification(String notification)	{
		JSONObject unifiedNotification = new JSONObject();

		try	{
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
		} catch (JSONException e) {
			PWLog.error(TAG, "push message parsing failed", e);
		}

		String result = unifiedNotification.toString();

		// wrap special characters
		result = result.replace("%", "%\"+\"");

		return result;
	}

	private void evalJs(String statement) {
		final String url = "javascript:" + statement;

		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					webView.loadUrl(url);
				} catch (Exception e) {
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

	@CordovaMethod
	private boolean setApiToken(String token) {
		if (token != null) {
			Pushwoosh.getInstance().setApiToken(token);
			return true;
		}
		return false;
	}

	private static JSONObject inboxMessageToJson(InboxMessage message) {
		JSONObject object = new JSONObject();
		try {
			object.put("code", message.getCode())
					.put("title", message.getTitle())
					.put("imageUrl", message.getImageUrl())
					.put("message",message.getMessage())
					.put("sendDate",message.getISO8601SendDate())
					.put("type", message.getType().getCode())
					.put("bannerUrl", message.getBannerUrl())
					.put("isRead",message.isRead())
					.put("actionParams",message.getActionParams())
					.put("isActionPerformed",message.isActionPerformed());

			Bundle bundle = JsonUtils.jsonStringToBundle( message.getActionParams());
			String customData = bundle.getString("u");
			if (customData != null) {
				object.put("customData", customData);
			}
		} catch (JSONException e) {
			PWLog.error("PushwooshInbox", "Failed to fetch inbox message :" + e.getMessage());
		}
		return object;
	}

}
