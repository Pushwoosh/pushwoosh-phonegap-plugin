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
PushNotification.prototype.onDeviceReady = function(config) {
	exec(null, null, "PushNotification", "onDeviceReady", config ? [config] : []);
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

//Function: startLocationTracking
//[android, ios, wp8, windows] Starts geolocation based push notifications. You need to configure Geozones in Pushwoosh Control panel.
//
//Parameters:
// "success" - success callback
// "fail" - error callback
//
PushNotification.prototype.startLocationTracking = function(success, fail) {
	exec(success, fail, "PushNotification", "startLocationTracking", []);
};

//Function: stopLocationTracking
//[android, ios, wp8, windows] Stops geolocation based push notifications
//
//Parameters:
// "success" - success callback
// "fail" - error callback
//
PushNotification.prototype.stopLocationTracking = function(success, fail) {
	exec(success, fail, "PushNotification", "stopLocationTracking", []);
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

//Function: createLocalNotification
//[android] Schedules local notification,
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
//	pushwoosh.createLocalNotification({msg:"Your pumpkins are ready!", seconds:30, userData:"optional"}
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

//Function: startBeaconPushes
//[android] Starts beacon tracking
PushNotification.prototype.startBeaconPushes = function(success, fail) {
	exec(success, fail, "PushNotification", "startBeaconPushes", []);
};

//Function: stopBeaconPushes
//[android] Stops beacon tracking
PushNotification.prototype.stopBeaconPushes = function(success, fail) {
	exec(success, fail, "PushNotification", "stopBeaconPushes", []);
};

//Function: setBeaconBackgroundMode
//[android] let the plugin know that the app went to background mode (or vise versa).
//Call this when going background when using beacons
PushNotification.prototype.setBeaconBackgroundMode = function(on, success, fail) {
	exec(success, fail, "PushNotification", "setBeaconBackgroundMode", [on]);
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

module.exports = new PushNotification();
