//
//  PushNotification.js
//
// Based on the Push Notifications Cordova Plugin by Olivier Louvignes on 06/05/12.
// Modified by Max Konev on 18/05/12.
//
// Pushwoosh Push Notifications Plugin for Cordova iOS
// www.pushwoosh.com
//
// MIT Licensed

(function(cordova) {

	function PushNotification() {}

	// Call this to register for push notifications and retreive a deviceToken
	PushNotification.prototype.registerDevice = function(config, success, fail) {
		cordova.exec(success, fail, "PushNotification", "registerDevice", config ? [config] : []);
	};

	// Call this to set tags for the device
	PushNotification.prototype.setTags = function(config, success, fail) {
		cordova.exec(success, fail, "PushNotification", "setTags", config ? [config] : []);
	};
	
	// Call this to send geo location for the device
	PushNotification.prototype.sendLocation = function(config, success, fail) {
		cordova.exec(success, fail, "PushNotification", "sendLocation", config ? [config] : []);
	};
	
	PushNotification.prototype.onDeviceReady = function() {
		cordova.exec(null, null, "PushNotification", "onDeviceReady", []);
	};

	//Android Only----
	PushNotification.prototype.unregisterDevice = function(success, fail) {
		cordova.exec(success, fail, "PushNotification", "unregisterDevice", []);
	};

	//config params: {msg:"message", seconds:30, userData:"optional"}
	PushNotification.prototype.createLocalNotification = function(config, success, fail) {
		cordova.exec(success, fail, "PushNotification", "createLocalNotification", config ? [config] : []);
	};

	PushNotification.prototype.clearLocalNotification = function() {
		cordova.exec(null, null, "PushNotification", "clearLocalNotification", []);
	};
	
	//advanced background task to track device position and not drain the battery
	PushNotification.prototype.startGeoPushes = function(success, fail) {
		cordova.exec(success, fail, "PushNotification", "startGeoPushes", []);
	};

	PushNotification.prototype.stopGeoPushes = function(success, fail) {
		cordova.exec(success, fail, "PushNotification", "stopGeoPushes", []);
	};
	
	//sets multi notification mode on
	PushNotification.prototype.setMultiNotificationMode = function(success, fail) {
		cordova.exec(success, fail, "PushNotification", "setMultiNotificationMode", []);
	};
	
	//sets single notification mode
	PushNotification.prototype.setSingleNotificationMode = function(success, fail) {
		cordova.exec(success, fail, "PushNotification", "setSingleNotificationMode", []);
	};

	//type: 0 default, 1 no sound, 2 always
	PushNotification.prototype.setSoundType = function(type, success, fail) {
		cordova.exec(success, fail, "PushNotification", "setSoundType", [type]);
	};	

	//type: 0 default, 1 no vibration, 2 always
	PushNotification.prototype.setVibrateType = function(type, success, fail) {
		cordova.exec(success, fail, "PushNotification", "setVibrateType", [type]);
	};	

	PushNotification.prototype.setLightScreenOnNotification = function(on, success, fail) {
		cordova.exec(success, fail, "PushNotification", "setLightScreenOnNotification", [on]);
	};

	//set to enable led blinking when notification arrives and display is off
	PushNotification.prototype.setEnableLED = function(on, success, fail) {
		cordova.exec(success, fail, "PushNotification", "setEnableLED", [on]);
	};
	
	//{goal:'name', count:3} (count is optional)
	PushNotification.prototype.sendGoalAchieved = function(config, success, fail) {
		cordova.exec(success, fail, "PushNotification", "sendGoalAchieved", config ? [config] : []);
	};

	//Android End----
	
	//iOS only----
	PushNotification.prototype.startLocationTracking = function(backgroundMode, success, fail) {
		cordova.exec(success, fail, "PushNotification", "startLocationTracking", backgroundMode ? [{mode : backgroundMode}] : []);
	};
	 
	PushNotification.prototype.stopLocationTracking = function(success, fail) {
		cordova.exec(success, fail, "PushNotification", "stopLocationTracking", []);
	};

	// Call this to get a detailed status of remoteNotifications
	PushNotification.prototype.getRemoteNotificationStatus = function(callback) {
		cordova.exec(callback, callback, "PushNotification", "getRemoteNotificationStatus", []);
	};

	// Call this to set the application icon badge
	PushNotification.prototype.setApplicationIconBadgeNumber = function(badgeNumber, callback) {
		cordova.exec(callback, callback, "PushNotification", "setApplicationIconBadgeNumber", [{badge: badgeNumber}]);
	};

	// Call this to clear all notifications from the notification center
	PushNotification.prototype.cancelAllLocalNotifications = function(callback) {
		cordova.exec(callback, callback, "PushNotification", "cancelAllLocalNotifications", []);
	};
	//iOS End----

	// Event spawned when a notification is received while the application is active
	PushNotification.prototype.notificationCallback = function(notification) {
		var ev = document.createEvent('HTMLEvents');
		ev.notification = notification;
		ev.initEvent('push-notification', true, true, arguments);
		document.dispatchEvent(ev);
	};

	cordova.addConstructor(function() {
		if(!window.plugins) window.plugins = {};
		window.plugins.pushNotification = new PushNotification();
	});

})(window.cordova || window.Cordova || window.PhoneGap);
