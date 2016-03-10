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
//				pushwoosh.onDeviceReady({ projectid: "XXXXXXXXXXXXXXX", pw_appid : "XXXXX-XXXXX" });
//(end)
function PushNotification() {}

//Function: registerDevice
//Call this to register for push notifications and retreive a push Token
//
//Example:
//(start code)
//	pushNotification.registerDevice(
//		function(token)
//		{
//			alert(token);
//		},
//		function(status)
//		{
//			alert("failed to register: " +  status);
//		}
//	);
//(end)
PushNotification.prototype.registerDevice = function(success, fail) {
	exec(success, fail, "PushNotification", "registerDevice", []);
};

//Function: setTags
//Call this to set tags for the device
//
//Example:
//sets the following tags: "deviceName" with value "hello" and "deviceId" with value 10
//(start code)
//	pushNotification.setTags({deviceName:"hello", deviceId:10},
//		function(status) {
//			console.warn('setTags success');
//		},
//		function(status) {
//			console.warn('setTags failed');
//		}
//	);
//
//	//setings list tags "MyTag" with values (array) "hello", "world"
//	pushNotification.setTags({"MyTag":["hello", "world"]});
//(end)
PushNotification.prototype.setTags = function(config, success, fail) {
	exec(success, fail, "PushNotification", "setTags", config ? [config] : []);
};

//Function: getPushToken
//Call this to get push token if it is available. Note the token also comes in registerDevice function callback.
//
//Example:
//(start code)
//	pushNotification.getPushToken(
//		function(token)
//		{
//			console.warn('push token: ' + token);
//		}
//	);
//(end)
PushNotification.prototype.getPushToken = function(success) {
	exec(success, null, "PushNotification", "getPushToken", []);
};

//Function: getPushwooshHWID
//Call this to get Pushwoosh HWID used for communications with Pushwoosh API
//
//Example:
//(start code)
//	pushNotification.getPushwooshHWID(
//		function(token) {
//			console.warn('Pushwoosh HWID: ' + token);
//		}
//	);
//(end)
PushNotification.prototype.getPushwooshHWID = function(success) {
	exec(success, null, "PushNotification", "getPushwooshHWID", []);
};

//Function: onDeviceReady
//Call this first thing with your Pushwoosh App ID (pw_appid parameter) and Google Project ID for Android (projectid parameter)
//
//Example:
//(start code)
//	//initialize Pushwoosh with projectid: "GOOGLE_PROJECT_ID", appid : "PUSHWOOSH_APP_ID". This will trigger all pending push notifications on start.
//	pushNotification.onDeviceReady({ projectid: "XXXXXXXXXXXXXXX", pw_appid : "XXXXX-XXXXX" });
//(end)
PushNotification.prototype.onDeviceReady = function(config) {
	exec(null, null, "PushNotification", "onDeviceReady", config ? [config] : []);
};

//Function: getTags
//Call this to get tags for the device
//
//Example:
//(start code)
//	pushNotification.getTags(
//		function(tags)
//		{
//			console.warn('tags for the device: ' + JSON.stringify(tags));
//		},
//		function(error)
//		{
//			console.warn('get tags error: ' + JSON.stringify(error));
//		}
//	);
//(end)
PushNotification.prototype.getTags = function(success, fail) {
	exec(success, fail, "PushNotification", "getTags", []);
};

//Function: unregisterDevice
//Unregisters device from push notifications
PushNotification.prototype.unregisterDevice = function(success, fail) {
	exec(success, fail, "PushNotification", "unregisterDevice", []);
};

//Function: startLocationTracking
//Starts geolocation based push notifications. You need to configure Geozones in Pushwoosh Control panel.
PushNotification.prototype.startLocationTracking = function(success, fail) {
	exec(success, fail, "PushNotification", "startLocationTracking", []);
};

//Function: stopLocationTracking
//Stops geolocation based push notifications
PushNotification.prototype.stopLocationTracking = function(success, fail) {
	exec(success, fail, "PushNotification", "stopLocationTracking", []);
};

//Function: createLocalNotification
//Android only, Creates local notification,
//config params: {msg:"message", seconds:30, userData:"optional"}
//
//Example:
//(start code)
//pushNotification.createLocalNotification({msg:"Your pumpkins are ready!", seconds:30, userData:"optional"}
//(end)
PushNotification.prototype.createLocalNotification = function(config, success, fail) {
	exec(success, fail, "PushNotification", "createLocalNotification", config ? [config] : []);
};

//Function: clearLocalNotification
//Android only, Clears pending local notifications created by <createLocalNotification>
PushNotification.prototype.clearLocalNotification = function() {
	exec(null, null, "PushNotification", "clearLocalNotification", []);
};

//Function: clearNotificationCenter
//Android only, Clears all notifications presented in Android Notification Center
PushNotification.prototype.clearNotificationCenter = function() {
	exec(null, null, "PushNotification", "clearNotificationCenter", []);
};

//Function: startGeoPushes
//Android only, Deprecated, use <startLocationTracking> and <stopLocationTracking>
PushNotification.prototype.startGeoPushes = function(success, fail) {
	exec(success, fail, "PushNotification", "startGeoPushes", []);
};

//Function: stopGeoPushes
//Android only, Deprecated, use <startLocationTracking> and <stopLocationTracking>
PushNotification.prototype.stopGeoPushes = function(success, fail) {
	exec(success, fail, "PushNotification", "stopGeoPushes", []);
};

//Function: startBeaconPushes
//Android only, iOS available per request, Call this to start beacon tracking
PushNotification.prototype.startBeaconPushes = function(success, fail) {
	exec(success, fail, "PushNotification", "startBeaconPushes", []);
};

//Function: stopBeaconPushes
//Android only, iOS available per request, Call this to stop beacon tracking
PushNotification.prototype.stopBeaconPushes = function(success, fail) {
	exec(success, fail, "PushNotification", "stopBeaconPushes", []);
};

//Function: setBeaconBackgroundMode
//Android only, let the plugin know that the app went to background mode (or vise versa).
//Call this when going background when using beacons
PushNotification.prototype.setBeaconBackgroundMode = function(on, success, fail) {
	exec(success, fail, "PushNotification", "setBeaconBackgroundMode", [on]);
};

//Function: setMultiNotificationMode
//Android only, Allows multiple notifications to be displayed in the Android Notification Center
PushNotification.prototype.setMultiNotificationMode = function(success, fail) {
	exec(success, fail, "PushNotification", "setMultiNotificationMode", []);
};

//Function: setSingleNotificationMode
//Android only, Allows only the last one notification to be displayed in the Android Notification Center
PushNotification.prototype.setSingleNotificationMode = function(success, fail) {
	exec(success, fail, "PushNotification", "setSingleNotificationMode", []);
};

//Function: setSoundType
//Android only, Sets default sound to play when push notification arrive.
//Values: 0 - default, 1 - no sound, 2 - always
PushNotification.prototype.setSoundType = function(type, success, fail) {
	exec(success, fail, "PushNotification", "setSoundType", [type]);
};

//Function: setVibrateType
//Android only, Sets default vibration mode when push notification arrive.
//Values: 0 - default, 1 - no vibration, 2 - always
PushNotification.prototype.setVibrateType = function(type, success, fail) {
	exec(success, fail, "PushNotification", "setVibrateType", [type]);
};

//Function: setLightScreenOnNotification
//Android only, Should the screen be lit up when push notification arrive
PushNotification.prototype.setLightScreenOnNotification = function(on, success, fail) {
	exec(success, fail, "PushNotification", "setLightScreenOnNotification", [on]);
};

//Function: setEnableLED
//Android only, Set to enable led blinking when notification arrives and display is off
PushNotification.prototype.setEnableLED = function(on, success, fail) {
	exec(success, fail, "PushNotification", "setEnableLED", [on]);
};

//Function: setEnableLED
//Android only, Set led color. Use with <setEnableLED>
PushNotification.prototype.setColorLED = function(color, success, fail) {
	exec(success, fail, "PushNotification", "setColorLED", [color]);
};

//Function: getPushHistory
//Android only, Gets push history, returns array of push notifications received.
//
//Example:
//(start code)
//	pushNotification.getPushHistory(function(pushHistory) {
//		if(pushHistory.length == 0)
//			alert("no push history");
//		else
//			alert(JSON.stringify(pushHistory));
//	});
//
//	pushNotification.clearPushHistory();
//(end)
PushNotification.prototype.getPushHistory = function(success) {
	exec(success, null, "PushNotification", "getPushHistory", []);
};

//Function: clearPushHistory
//Android only, Clears push history
PushNotification.prototype.clearPushHistory = function() {
	exec(null, null, "PushNotification", "clearPushHistory", []);
};

//Function: getRemoteNotificationStatus
//iOS only,
//Call this to get a detailed status of push notification permissions.
//
//Returns array with the following items:
//
//"enabled" - if push notificaions enabled.
//"pushBadge" -  badges permission granted.
//"pushAlert" -  alert permission granted.
//"pushSound" -  sound permission granted.
PushNotification.prototype.getRemoteNotificationStatus = function(callback) {
	exec(callback, callback, "PushNotification", "getRemoteNotificationStatus", []);
};

//Function: setApplicationIconBadgeNumber
//iOS only,
//Call this to set the application icon badge
PushNotification.prototype.setApplicationIconBadgeNumber = function(badgeNumber) {
	exec(null, null, "PushNotification", "setApplicationIconBadgeNumber", [{
		badge: badgeNumber
	}]);
};

//Function: getApplicationIconBadgeNumber
//iOS only,
//Call this to get the application icon badge
//
//Example:
//(start code)
//	pushwoosh.getApplicationIconBadgeNumber(function(badge){ alert(badge);} );
//(end)
PushNotification.prototype.getApplicationIconBadgeNumber = function(callback) {
	exec(callback, callback, "PushNotification", "getApplicationIconBadgeNumber", []);
};

//Function: addToApplicationIconBadgeNumber
//iOS only,
//Call this to add value to the application icon badge
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

//Function: cancelAllLocalNotifications
//iOS only,
//Call this to clear all notifications from the notification center
PushNotification.prototype.cancelAllLocalNotifications = function(callback) {
	exec(callback, callback, "PushNotification", "cancelAllLocalNotifications", []);
};
//iOS End----

//Function: getLaunchNotification
//Returns push notification payload if the app was started in response to push notification
//or null otherwise
PushNotification.prototype.getLaunchNotification = function(callback) {
	exec(callback, callback, "PushNotification", "getLaunchNotification", []);
};

// Event spawned when a notification is received while the application is active
PushNotification.prototype.notificationCallback = function(notification) {
	var ev = document.createEvent('HTMLEvents');
	ev.notification = notification;
	ev.initEvent('push-notification', true, true, arguments);
	document.dispatchEvent(ev);
};

module.exports = new PushNotification();
