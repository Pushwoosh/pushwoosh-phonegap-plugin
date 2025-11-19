//
//  PushNotification.js
//
// Based on the Push Notifications Cordova Plugin by Olivier Louvignes.
// Modified by Pushwoosh team.
//
// Pushwoosh Push Notifications Plugin for Cordova
// www.pushwoosh.com
//
// MIT Licensed

var exec = window.cordova.exec;

//Class: PushNotification
//Class to interact with Pushwoosh Push Notifications plugin
//
//Example:
//(start code)
//	    	    var pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");
//				pushwoosh.onDeviceReady({ 
//					appid : "XXXXX-XXXXX",
//					projectid: "XXXXXXXXXXXXXXX", 
//					serviceName: "XXXX" 
//				});
//(end)
function PushNotification() {}

//Function: onDeviceReady
//[android, ios, wp8, windows] Initialize Pushwoosh plugin and trigger a start push message
//Should be called on every app launch
//
//Parameters:
// "config.appid" - Pushwoosh application code
// "config.projectid" - GCM project number for android platform
// "config.serviceName" - MPNS service name for wp8 platform
//
//Example:
//(start code)
//	//initialize Pushwoosh with projectid: "GOOGLE_PROJECT_NUMBER", appid : "PUSHWOOSH_APP_ID", serviceName : "WINDOWS_PHONE_SERVICE". This will trigger all pending push notifications on start.
//	pushwoosh.onDeviceReady({ 
//		appid : "XXXXX-XXXXX",
//		projectid: "XXXXXXXXXXXXXXX", 
//		serviceName: "XXXX" 
//	});
//(end)
PushNotification.prototype.onDeviceReady = function(config) {
	exec(null, null, "PushNotification", "onDeviceReady", config ? [config] : []);
};

//Function: onAppActivated
//[windows] The event fires when Windows Runtime activation has occurred
//
//Parameters:
// "args" - activation arguments
//
PushNotification.prototype.onAppActivated = function (args) {
    exec(null, null, "PushNotification", "onAppActivated", args ? [args] : []);
};

//Function: registerDevice
//[android, ios, wp8, windows] Register device for push notifications and retreive a push Token
//
//Parameters:
// "success" - success callback. Push token is passed as "status.pushToken" parameter to this callback
// "fail" - error callback
//
//Example:
//(start code)
//	pushwoosh.registerDevice(
//		function(status) {
//			alert("Registered with push token: " + status.pushToken);
//		},
//		function(error) {
//			alert("Failed to register: " +  error);
//		}
//	);
//(end)
PushNotification.prototype.registerDevice = function(success, fail) {
	exec(success, fail, "PushNotification", "registerDevice", []);
};

//Function: additionalAuthorizationOptions
//[ios] Authorization options in addition to UNAuthorizationOptionBadge | UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionCarPlay. 
//Should be called before registering for pushes
//
//Parameters:
// "options.UNAuthorizationOptionCriticalAlert" - adds UNAuthorizationOptionCriticalAlert option
// "options.UNAuthorizationOptionProvisional" - adds UNAuthorizationOptionProvisional option
// "options.UNAuthorizationOptionProvidesAppNotificationSettings" - adds UNAuthorizationOptionProvidesAppNotificationSettings option
//
//Example:
//(start code)
//	pushwoosh.additionalAuthorizationOptions({ 
//		"UNAuthorizationOptionCriticalAlert" : 1,
//		"UNAuthorizationOptionProvisional": 0 // set 0 or don't specify the option if you don't want to add it to your app. 
//	});
//(end)
PushNotification.prototype.additionalAuthorizationOptions = function(options) {
	exec(null, null, "PushNotification", "additionalAuthorizationOptions", options ? [options] : []);
}

//Function: unregisterDevice
//[android, ios, wp8, windows] Unregister device form receiving push notifications
//
//Parameters:
// "success" - success callback
// "fail" - error callback
//
//Unregisters device from push notifications
PushNotification.prototype.unregisterDevice = function(success, fail) {
	exec(success, fail, "PushNotification", "unregisterDevice", []);
};

//Function: setTags
//[android, ios, wp8, windows] Set tags for the device
//
//Parameters:
// "config" - object with custom device tags
// "success" - success callback
// "fail" - error callback
//
//Example:
//sets the following tags: "deviceName" with value "hello" and "deviceId" with value 10
//(start code)
//	pushwoosh.setTags({deviceName:"hello", deviceId:10},
//		function() {
//			console.warn('setTags success');
//		},
//		function(error) {
//			console.warn('setTags failed');
//		}
//	);
//
//	//setings list tags "MyTag" with values (array) "hello", "world"
//	pushwoosh.setTags({"MyTag":["hello", "world"]});
//(end)
PushNotification.prototype.setTags = function(config, success, fail) {
	exec(success, fail, "PushNotification", "setTags", config ? [config] : []);
};

//Function: getTags
//[android, ios, wp8, windows] Returns tags for the device including default tags
//
//Parameters:
// "success" - success callback. Receives tags as parameter
// "fail" - error callback
//
//Example:
//(start code)
//	pushwoosh.getTags(
//		function(tags) {
//			console.warn('tags for the device: ' + JSON.stringify(tags));
//		},
//		function(error) {
//			console.warn('get tags error: ' + JSON.stringify(error));
//		}
//	);
//(end)
PushNotification.prototype.getTags = function(success, fail) {
	exec(success, fail, "PushNotification", "getTags", []);
};

//Function: getPushToken
//[android, ios, wp8, windows] Returns push token if it is available. Note the token also comes in registerDevice function callback.
//
//Parameters:
// "success" - getPushToken callback
//
//Example:
//(start code)
//	pushwoosh.getPushToken(
//		function(token) {
//			console.warn('push token: ' + token);
//		}
//	);
//(end)
PushNotification.prototype.getPushToken = function(success) {
	exec(success, null, "PushNotification", "getPushToken", []);
};

//Function: getPushwooshHWID
//[android, ios, wp8, windows] Returns Pushwoosh HWID used for communications with Pushwoosh API
//
//Parameters:
// "success" - getPushwooshHWID callback
//
//Example:
//(start code)
//	pushwoosh.getPushwooshHWID(
//		function(token) {
//			console.warn('Pushwoosh HWID: ' + token);
//		}
//	);
//(end)
PushNotification.prototype.getPushwooshHWID = function(success) {
	exec(success, null, "PushNotification", "getPushwooshHWID", []);
};

//Function: getRemoteNotificationStatus
//[android, ios] Returns a detailed status of push notification permissions.
//
//Parameters:
// "callback" - success callback
// "error" - error callback
//
//Returns array with the following items:
//
//"enabled" - if push notificaions enabled.
//"pushBadge" -  badges permission granted. (iOS only)
//"pushAlert" -  alert permission granted. (iOS only)
//"pushSound" -  sound permission granted. (iOS only)
PushNotification.prototype.getRemoteNotificationStatus = function(callback, error) {
	exec(callback, error, "PushNotification", "getRemoteNotificationStatus", []);
};

//Function: setApplicationIconBadgeNumber
//[android, ios, wp8, windows] Set the application icon badge number
//
//Parameters:
// "badgeNumber" - icon badge number
//
PushNotification.prototype.setApplicationIconBadgeNumber = function(badgeNumber) {
	exec(null, null, "PushNotification", "setApplicationIconBadgeNumber", [{
		badge: badgeNumber
	}]);
};

//Function: getApplicationIconBadgeNumber
//[android, ios] Returns the application icon badge number
//
//Parameters:
// "callback" - success callback
//
//Example:
//(start code)
//	pushwoosh.getApplicationIconBadgeNumber(function(badge){ alert(badge);} );
//(end)
PushNotification.prototype.getApplicationIconBadgeNumber = function(callback) {
	exec(callback, callback, "PushNotification", "getApplicationIconBadgeNumber", []);
};

//Function: addToApplicationIconBadgeNumber
//[android, ios] Adds value to the application icon badge
//
//Parameters:
// "badgeNumber" - incremental icon badge number
//
//Example:
//(start code)
//	pushwoosh.addToApplicationIconBadgeNumber(5);
//	pushwoosh.addToApplicationIconBadgeNumber(-5);
//(end)
PushNotification.prototype.addToApplicationIconBadgeNumber = function(badgeNumber) {
	exec(null, null, "PushNotification", "addToApplicationIconBadgeNumber", [{
		badge: badgeNumber
	}]);
};

//Function: getLaunchNotification
//[android, ios] Returns push notification payload if the app was started in response to push notification
//or null otherwise
//
//Parameters:
// "callback" - success callback
//
PushNotification.prototype.getLaunchNotification = function(callback) {
	exec(callback, callback, "PushNotification", "getLaunchNotification", []);
};

//Function: clearLaunchNotification
//[android, ios] Clears launch notifiation, getLaunchNotification() will return null after this call.
PushNotification.prototype.clearLaunchNotification = function(callback) {
	exec(callback, callback, "PushNotification", "clearLaunchNotification", []);
};

//Function: setLanguage
//[android, ios] Set custom application language (as opposed to the default system language).
//This allows sending localized push messages
//
//Parameters:
// "language" - string containing language code, i.e. "en", "fr"
//
PushNotification.prototype.setLanguage = function(language) {
	exec(null, null, "PushNotification", "setLanguage", [language]);
};

//Function: setShowPushnotificationAlert
//[android, ios] Configure custom foreground push notification settings distinct from the default system configuration.
//This allows show foreground push notifications
//
//Parameters:
// "showPushnotificationAlert" - bool value
//

PushNotification.prototype.setShowPushnotificationAlert = function(showPushnotificationAlert) {
	exec(null, null, "PushNotification", "setShowPushnotificationAlert", [showPushnotificationAlert]);
};

//Function: setUserId
//[android, ios] Set User indentifier. This could be Facebook ID, username or email, or any other user ID.
//This allows data and events to be matched across multiple user devices.
//
//Parameters:
// "userId" - user string identifier
//
PushNotification.prototype.setUserId = function(userId) {
	exec(null, null, "PushNotification", "setUserId", [userId]);
};

//Function: postEvent
//[android, ios] Post events for In-App Messages. This can trigger In-App message display as specified in Pushwoosh Control Panel.
//
//Parameters:
// "event" - event to trigger
// "attributes" - object with additional event attributes
// 
// Example:
//(start code)
// pushwoosh.setUserId("XXXXXX");
// pushwoosh.postEvent("buttonPressed", { "buttonNumber" : 4, "buttonLabel" : "banner" });
//(end)
PushNotification.prototype.postEvent = function(event, attributes) {
	exec(null, null, "PushNotification", "postEvent", [event, attributes]);
};

//Function: addJavaScriptInterface
//Adds javascript interface for In-App Messages.
//Interface will be accessible from Rich Media as object with specified `name` and function 'callFunction('<function_name>', JSON.stringify(<params>))'.
//
//Parameters:
// "name" - interface name
//
//Example:
//Cordova part:
//  function foo() {
//      alert("Bridge is working!");
//  }
//
//
//  pushwoosh.addJavaScriptInterface('testBridge');
//
//Rich Media part:
//  testBridge.callFunction('foo', JSON.stringify({'param1':1,'param2':'test'}))
PushNotification.prototype.addJavaScriptInterface = function(name) {
    exec(null, null, "PushNotification", "addJavaScriptInterface", [name]);
};

//Function: createLocalNotification
//[android, ios] Schedules local notification,
//
//Parameters:
// "config.msg" - notification message
// "config.seconds" - notification delay in seconds
// "config.userData" - addition data to pass in notification
// "success" - success callback
// "fail" - error callback
//
//Example:
//(start code)
//	pushwoosh.createLocalNotification({msg:"Your pumpkins are ready!", seconds:30, userData:"optional"});
//(end)
PushNotification.prototype.createLocalNotification = function(config, success, fail) {
	exec(success, fail, "PushNotification", "createLocalNotification", config ? [config] : []);
};

//Function: clearLocalNotification
//[android] Clears all pending local notifications created by <createLocalNotification>
PushNotification.prototype.clearLocalNotification = function() {
	exec(null, null, "PushNotification", "clearLocalNotification", []);
};

//Function: clearNotificationCenter
//[android] Clears all notifications presented in Android Notification Center
PushNotification.prototype.clearNotificationCenter = function() {
	exec(null, null, "PushNotification", "clearNotificationCenter", []);
};

//Function: setMultiNotificationMode
//[android] Allows multiple notifications to be displayed in the Android Notification Center
PushNotification.prototype.setMultiNotificationMode = function(success, fail) {
	exec(success, fail, "PushNotification", "setMultiNotificationMode", []);
};

//Function: setSingleNotificationMode
//[android] Allows only the last one notification to be displayed in the Android Notification Center
PushNotification.prototype.setSingleNotificationMode = function(success, fail) {
	exec(success, fail, "PushNotification", "setSingleNotificationMode", []);
};

//Function: setSoundType
//[android] Sets default sound to play when push notification arrive.
//
//Parameters:
// "type" - Sound type (0 - default, 1 - no sound, 2 - always)
//
PushNotification.prototype.setSoundType = function(type, success, fail) {
	exec(success, fail, "PushNotification", "setSoundType", [type]);
};

//Function: setVibrateType
//[android] Sets default vibration mode when push notification arrive.
//
//Parameters:
// "type" - Vibration type (0 - default, 1 - no vibration, 2 - always)
//
PushNotification.prototype.setVibrateType = function(type, success, fail) {
	exec(success, fail, "PushNotification", "setVibrateType", [type]);
};

//Function: setLightScreenOnNotification
//[android] Turns the screen on if notification arrives
//
//Parameters:
// "on" - enable/disable screen unlock (is disabled by default)
//
PushNotification.prototype.setLightScreenOnNotification = function(on, success, fail) {
	exec(success, fail, "PushNotification", "setLightScreenOnNotification", [on]);
};

//Function: setEnableLED
//[android] Enables led blinking when notification arrives and display is off
//
//Parameters:
// "on" - enable/disable led blink (is disabled by default)
//
PushNotification.prototype.setEnableLED = function(on, success, fail) {
	exec(success, fail, "PushNotification", "setEnableLED", [on]);
};

//Function: setEnableLED
//[android] Set led color. Use with <setEnableLED>
//
//Parameters:
// "color" - led color in ARGB integer format
//
PushNotification.prototype.setColorLED = function(color, success, fail) {
	exec(success, fail, "PushNotification", "setColorLED", [color]);
};

//Function: getPushHistory
//[android] Returns array of push notifications received.
//
//Parameters:
// "success" - success callback
//
//Example:
//(start code)
//	pushwoosh.getPushHistory(function(pushHistory) {
//		if(pushHistory.length == 0)
//			alert("no push history");
//		else
//			alert(JSON.stringify(pushHistory));
//	});
//
//	pushwoosh.clearPushHistory();
//(end)
PushNotification.prototype.getPushHistory = function(success) {
	exec(success, null, "PushNotification", "getPushHistory", []);
};

//Function: clearPushHistory
//[android] Clears push history
PushNotification.prototype.clearPushHistory = function() {
	exec(null, null, "PushNotification", "clearPushHistory", []);
};

//Function: cancelAllLocalNotifications
//[ios] Clears all notifications from the notification center
PushNotification.prototype.cancelAllLocalNotifications = function(callback) {
	exec(callback, callback, "PushNotification", "cancelAllLocalNotifications", []);
};

// Event spawned when a notification is received while the application is active
PushNotification.prototype.pushReceivedCallback = function(notification) {
	var ev = document.createEvent('HTMLEvents');
	ev.notification = notification;
	ev.initEvent('push-receive', true, true, arguments);
	document.dispatchEvent(ev);
};

// Event spawned when a notification is opened while the application is active
PushNotification.prototype.notificationCallback = function(notification) {
	var ev = document.createEvent('HTMLEvents');
	ev.notification = notification;
	ev.initEvent('push-notification', true, true, arguments);
	document.dispatchEvent(ev);
};

// CallKit, PushKit
/**
 * Registers a callback for a specific VoIP-related event.
 *
 * This method allows you to subscribe to a predefined set of VoIP events.
 * When the specified event occurs, the provided success callback will be invoked.
 *
 * @param {string} eventName - The name of the event to register for.
 *                             Supported event names include:
 *                             - "answer": Triggered when the call is answered.
 *                             - "hangup": Triggered when the call is hung up.
 *                             - "reject": Triggered when the call is rejected.
 *                             - "muted": Triggered when the call is muted or unmuted.
 *                             - "held": Triggered when the call is put on or off hold.
 *                             - "voipPushPayload": Triggered when a VoIP push notification is received.
 *                             - "incomingCallSuccess": Triggered when an incoming call is successfully displayed.
 *                             - "incomingCallFailure": Triggered when displaying the incoming call fails.
 *                             - "playDTMF": Triggered when a DTMF tone is played.
 *                             - "voipDidFailToRegisterTokenWithError": Triggered when VoIP token registration fails (iOS only).
 *                             - "voipDidRegisterTokenSuccessfully": Triggered when VoIP token registration succeeds (iOS only).
 *                             - "voipDidCancelCall": Triggered when a call is remotely cancelled via VoIP push.
 *                             - "voipDidFailToCancelCall": Triggered when a call cancellation attempt fails.
 *
 * @param {Function} success - Callback function to be invoked when the event occurs.
 * @param {Function} fail - Callback function to be invoked if the registration fails.
 */
PushNotification.prototype.registerEvent = function(eventName, success, fail) {
	exec(success, fail, "PushNotification", "registerEvent", [eventName]);
};

/**
 * Unregisters a callback for a specific VoIP-related event.
 *
 * This method allows you to unsubscribe from a previously registered VoIP event.
 * After unregistering, the event callback will no longer be invoked when the event occurs.
 *
 * @param {string} eventName - The name of the event to unregister from.
 *                             This should match the event name used in registerEvent().
 *                             Supported event names include:
 *                             - "answer": Triggered when the call is answered.
 *                             - "hangup": Triggered when the call is hung up.
 *                             - "reject": Triggered when the call is rejected.
 *                             - "muted": Triggered when the call is muted or unmuted.
 *                             - "held": Triggered when the call is put on or off hold.
 *                             - "voipPushPayload": Triggered when a VoIP push notification is received.
 *                             - "incomingCallSuccess": Triggered when an incoming call is successfully displayed.
 *                             - "incomingCallFailure": Triggered when displaying the incoming call fails.
 *                             - "playDTMF": Triggered when a DTMF tone is played.
 *                             - "voipDidFailToRegisterTokenWithError": Triggered when VoIP token registration fails (iOS only).
 *                             - "voipDidRegisterTokenSuccessfully": Triggered when VoIP token registration succeeds (iOS only).
 *                             - "voipDidCancelCall": Triggered when a call is remotely cancelled via VoIP push.
 *                             - "voipDidFailToCancelCall": Triggered when a call cancellation attempt fails.
 *
 * @param {Function} success - Callback function to be invoked when the event is successfully unregistered.
 * @param {Function} fail - Callback function to be invoked if the unregistration fails.
 */
PushNotification.prototype.unregisterEvent = function(eventName, success, fail) {
	exec(success, fail, "PushNotification", "unregisterEvent", [eventName]);
};

/**
 * Initializes VoIP call parameters for the native calling system.
 *
 * This method configures options related to VoIP calls such as video support,
 * custom ringtone, and handle type used for identifying the caller.
 * These parameters affect how the call will be displayed and handled by the system (e.g., CallKit on iOS).
 *
 * If no parameters are provided, defaults will be used.
 * Handles optional argument shifting when called with fewer parameters.
 *
 * @param {boolean} [supportsVideo] - Indicates whether video calls are supported. Defaults to `false`.
 * @param {string} [ringtoneSound] - The name of the custom ringtone sound file (e.g., `"mySound.caf"`). Defaults to an empty string.
 * @param {number} [handleTypes] - Type of call handle to use (iOS-only, Android does not require this setting):
 *   - `1` – Generic
 *   - `2` – Phone number
 *   - `3` – Email address
 *   Defaults to `1` if not provided.
 * @param {Function} success - Callback invoked when the parameters are successfully initialized.
 * @param {Function} error - Callback invoked if initialization fails.
 *
 * @example
 * PushNotification.initializeVoIPParameters(true, "ringtone.caf", 2, onSuccess, onError);
 * PushNotification.initializeVoIPParameters(onSuccess, onError); // Use default values
 */
PushNotification.prototype.initializeVoIPParameters = function(supportsVideo, ringtoneSound, handleTypes, success, error) {
    if (typeof handleTypes === "function") {
        error = ringtoneSound;
        success = supportsVideo;
        handleTypes = undefined;
        ringtoneSound = undefined;
        supportsVideo = undefined;
    }

    exec(success, error, "PushNotification", "initializeVoIPParameters", [
        !!supportsVideo,
        ringtoneSound || "",
        handleTypes != null ? Number(handleTypes) : 1
    ]);
};

/**
 * Enables the device speaker during an active call.
 *
 * This method routes the call audio output through the device’s loudspeaker
 * instead of the earpiece. Useful for hands-free or speakerphone mode.
 *
 * @param {Function} success - Callback invoked when the speaker is successfully enabled.
 * @param {Function} error - Callback invoked if the operation fails.
 *
 * @example
 * PushNotification.speakerOn(onSuccess, onError);
 */
PushNotification.prototype.speakerOn = function(success, error) {
    exec(success, error, "PushNotification", "speakerOn", []);
};

/**
 * Disables the device speaker and routes audio back to the earpiece.
 *
 * This method returns the audio output to the default mode (typically the earpiece),
 * which is used for private voice conversations.
 *
 * @param {Function} success - Callback invoked when the speaker is successfully disabled.
 * @param {Function} error - Callback invoked if the operation fails.
 *
 * @example
 * PushNotification.speakerOff(onSuccess, onError);
 */
PushNotification.prototype.speakerOff = function(success, error) {
    exec(success, error, "PushNotification", "speakerOff", []);
};

/**
 * Mute device microphone
 * @param {Function} success - Callback invoked when the microphone is successfully disabled.
 * @param {Function} error - Callback invoked if the operation fails.
 */
PushNotification.prototype.mute = function(success, error) {
	    exec(success, error, "PushNotification", "speakerOff", []);

}

/**
 * Unmute device microphone
 * @param {Function} success - Callback invoked when the microphone is successfully enable.
 * @param {Function} error - Callback invoked if the operation fails.
 */
PushNotification.prototype.unmute = function(success, error) {
	    exec(success, error, "PushNotification", "unmute", []);

}

// Android calls
/**
 * Request call permission and register phone account
 * @param {Function} success - Callback invoked with permission result
 * @param {Function} error - Callback invoked if the operation fails
 */
PushNotification.prototype.requestCallPermission = function(success, error) {
	exec(success, error, "PushNotification", "requestCallPermission", []);
}

/**
 * Get call permission status
 * Returns a Promise or calls success callback with status:
 *   0 - Permission not requested yet
 *   1 - Permission granted by user
 *   2 - Permission denied by user
 * @param {Function} success - Callback invoked with permission status
 * @param {Function} error - Callback invoked if the operation fails
 */
PushNotification.prototype.getCallPermissionStatus = function(success, error) {
	exec(success, error, "PushNotification", "getCallPermissionStatus", []);
}

/**
 * Notifies Pushwoosh that the call has ended
 * @param {Function} success - Callback invoked when the call ends.
 * @param {Function} error - Callback invoked if the operation fails.
 */
PushNotification.prototype.endCall = function(success, error) {
	exec(success, error, "PushNotification", "endCall", []);
}

// Opens Inbox screen.
//
// Supported style keys:
//
// Customizes the date formatting
// "dateFormat"
//
// The default icon in the cell next to the message; if not specified, the app icon is used
// "defaultImageIcon"
//
// The appearance of the unread messages mark (iOS only)
// "unreadImage"
//
// The image which is displayed if an error occurs and the list of inbox messages is empty
// "listErrorImage"
//
// The image which is displayed if the list of inbox messages is empty
// "listEmptyImage"
//
// The error text which is displayed when an error occurs; cannot be localized
// "listErrorMessage"
//
// The text which is displayed if the list of inbox messages is empty; cannot be localized
// "listEmptyMessage"
//
// The default text color (iOS only)
// "defaultTextColor"
//
// The accent color
// "accentColor"
//
// The default background color
// "backgroundColor"
//
// The default selection color
// "highlightColor"
//
// The color of message titles
// "titleColor"
//
// The color of message titles if message was readed (Android only)
// "readTitleColor"
//
// The color of messages descriptions
// "descriptionColor"
//
// The color of messages descriptions if message was readed (Android only)
// "readDescriptionColor"
//
// The color of message dates
// "dateColor"
//
// The color of message dates if message was readed (Android only)
// "readDateColor"
//
// The color of the separator
// "dividerColor"
//
//Example:
// Pushwoosh.presentInboxUI({
//   "dateFormat" : "dd.MMMM.yyyy",
//   "defaultImageIcon" : 'img/icon.png',
//   "listErrorImage" : 'img/error.png',
//   "listEmptyImage" : 'img/empty.png',
//   "listErrorMessage" : "Error message",
//   "listEmptyMessage" : "Empty message",
//   "accentColor" : '#ff00ff',
//   "highlightColor" : '#ff00ff',
//   "dateColor" : '#ff00ff',
//   "titleColor" : '#ff00ff',
//   "dividerColor" : '#ff00ff',
//   "descriptionColor" : '#ff00ff',
//   "backgroundColor" : '#ff00ff'
// });
PushNotification.prototype.presentInboxUI = function(params) {
	exec(null, null, "PushNotification", "presentInboxUI", [ params ]);
}

// Load an array of InboxNotification objects
PushNotification.prototype.loadMessages = function(success, fail) {
	exec(success, fail, "PushNotification", "loadMessages", []);
}

// Get number of inbox messages with no action performed
PushNotification.prototype.messagesWithNoActionPerformedCount = function(success) {
	exec(success, null, "PushNotification", "messagesWithNoActionPerformedCount", []);
}

// Get number of unread inbox messages
PushNotification.prototype.unreadMessagesCount = function(success) {
	exec(success, null,"PushNotification", "unreadMessagesCount", []);
}

// Get total number of inbox messages
PushNotification.prototype.messagesCount = function(success) {
	exec(success, null,"PushNotification", "messagesCount", []);
}

// Mark inbox message as read
PushNotification.prototype.readMessage = function(number) {
	exec(null, null, "PushNotification", "readMessage", [number]);
}

// Delete message from inbox
PushNotification.prototype.deleteMessage = function(number) {
	exec(null, null, "PushNotification", "deleteMessage", [number]);
}

// Perform action for specified inbox message (i.e. open URL)
PushNotification.prototype.performAction = function(number) {
	exec(null, null, "PushNotification", "performAction", [number]);
}

// Enable/disable all communication with Pushwoosh. Enabled by default.
PushNotification.prototype.setCommunicationEnabled = function(enable, success, fail) {
	exec(success, fail, "PushNotification", "setCommunicationEnabled", [enable]);
};

// Register email associated to the current user.
// Email should be a string and could not be null or empty.
PushNotification.prototype.setEmail = function(email, success, fail) {
    exec(success, fail, "PushNotification", "setEmail", [email]);
};

// Register list of emails associated to the current user.
PushNotification.prototype.setEmails = function(emails, success, fail) {
    exec(success, fail, "PushNotification", "setEmails", [emails]);
};

// Set user identifier and register emails associated to the user.
// userID can be Facebook ID or any other user ID.
// This allows data and events to be matched across multiple user devices.
PushNotification.prototype.setUserEmails = function(userId, emails, success, fail) {
    exec(success, fail, "PushNotification", "setUserEmails", [userId, emails]);
};

// Registers phone number associated to the current user.
// PhoneNumber should be a string and cannot be null or empty.
PushNotification.prototype.registerSMSNumber = function(phoneNumber, success, fail) {
	exec(success, fail, "PushNotification", "registerSMSNumber", [phoneNumber]);
};

// Registers Whatsapp number associated to the current user.
// PhoneNumber should be a string and cannot be null or empty.
PushNotification.prototype.registerWhatsappNumber = function(phoneNumber, success, fail) {
	exec(success, fail, "PushNotification", "registerWhatsappNumber", [phoneNumber]);
};

PushNotification.prototype.isCommunicationEnabled = function(success) {
	return exec(success, null, "PushNotification", "isCommunicationEnabled", []);
};

// Enable Huawei push notifications in Android
PushNotification.prototype.enableHuaweiPushNotifications = function() {
	exec(null, null, "PushNotification", "enableHuaweiPushNotifications", []);
}

PushNotification.prototype.setApiToken = function(token) {
	exec(null, null, "PushNotification", "setApiToken", [token]);
}

PushNotification.prototype.setVoipAppCode = function(appCode) {
	exec(null, null, "PushNotification", "setVoipAppCode", [appCode]);
}

PushNotification.prototype.setIncomingCallTimeout = function(timeoutSeconds) {
	exec(null, null, "PushNotification", "setIncomingCallTimeout", [timeoutSeconds]);
}

module.exports = new PushNotification();
