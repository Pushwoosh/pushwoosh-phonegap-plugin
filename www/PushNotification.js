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

var exec = require('cordova/exec');

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
PushNotification.prototype.onDeviceReady = function(success, fail, config) {
	exec(success, fail, "PushNotification", "onDeviceReady", config ? [config] : []);
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

// Show inApp for change setting Enable/disable all communication with Pushwoosh
PushNotification.prototype.showGDPRConsentUI = function() {
	exec(null, null, "PushNotification", "showGDPRConsentUI", []);
}

// Show inApp for all device data from Pushwoosh and stops all interactions and communication permanently.
PushNotification.prototype.showGDPRDeletionUI = function() {
	exec(null, null, "PushNotification", "showGDPRDeletionUI", []);
}

// Enable/disable all communication with Pushwoosh. Enabled by default.
PushNotification.prototype.setCommunicationEnabled = function(enable, success, fail) {
	exec(success, fail, "PushNotification", "setCommunicationEnabled", [enable]);
};

// Removes all device data from Pushwoosh and stops all interactions and communication permanently.
PushNotification.prototype.removeAllDeviceData = function(success, fail) {
	exec(success, fail, "PushNotification", "removeAllDeviceData", []);
};

PushNotification.prototype.isCommunicationEnabled = function(success) {
	return exec(success, null, "PushNotification", "isCommunicationEnabled", []);
};

PushNotification.prototype.isDeviceDataRemoved = function(success) {
	return exec(success, null, "PushNotification", "isDeviceDataRemoved", []);
};

// Indicates availability of the GDPR compliance solution.
PushNotification.prototype.isAvailableGDPR = function(success) {
	return exec(success, null, "PushNotification", "isAvailableGDPR", []);
};

// Enable Huawei push notifications in Android
PushNotification.prototype.enableHuaweiPushNotifications = function() {
	exec(null, null, "PushNotification", "enableHuaweiPushNotifications", []);
}

module.exports = new PushNotification();
