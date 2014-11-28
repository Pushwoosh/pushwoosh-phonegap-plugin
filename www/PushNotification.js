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

var exec = require('cordova/exec');

function PushNotification() {}

// Call this to register for push notifications and retreive a push Token
PushNotification.prototype.registerDevice = function(success, fail) {
	exec(success, fail, "PushNotification", "registerDevice", []);
};

// Call this to set tags for the device
PushNotification.prototype.setTags = function(config, success, fail) {
	exec(success, fail, "PushNotification", "setTags", config ? [config] : []);
};

// Call this to get push token if it is available
PushNotification.prototype.getPushToken = function(success) {
	exec(success, null, "PushNotification", "getPushToken", []);
};

// Call this to get Pushwoosh HWID used for communications with Pushwoosh API
PushNotification.prototype.getPushwooshHWID = function(success) {
	exec(success, null, "PushNotification", "getPushwooshHWID", []);
};

// Call this first thing with your Pushwoosh App ID (see example)
PushNotification.prototype.onDeviceReady = function(config) {
	exec(null, null, "PushNotification", "onDeviceReady", config ? [config] : []);
};

// Call this to send geo location for the device
PushNotification.prototype.sendLocation = function(config, success, fail) {
	exec(success, fail, "PushNotification", "sendLocation", config ? [config] : []);
};

// Call this to get tags for the device
PushNotification.prototype.getTags = function(success, fail) {
	exec(success, fail, "PushNotification", "getTags", []);
};

PushNotification.prototype.unregisterDevice = function(success, fail) {
	exec(success, fail, "PushNotification", "unregisterDevice", []);
};

// Enable Geozones for your Pushwoosh app to be able to use these
PushNotification.prototype.startLocationTracking = function(success, fail) {
  exec(success, fail, "PushNotification", "startLocationTracking", []);
};

PushNotification.prototype.stopLocationTracking = function(success, fail) {
  exec(success, fail, "PushNotification", "stopLocationTracking", []);
};

//Android Only----
//config params: {msg:"message", seconds:30, userData:"optional"}
PushNotification.prototype.createLocalNotification = function(config, success, fail) {
	exec(success, fail, "PushNotification", "createLocalNotification", config ? [config] : []);
};

PushNotification.prototype.clearLocalNotification = function() {
	exec(null, null, "PushNotification", "clearLocalNotification", []);
};

PushNotification.prototype.clearNotificationCenter = function() {
	exec(null, null, "PushNotification", "clearNotificationCenter", []);
};

//advanced background task to track device position and not drain the battery
//deprecated, use startLocationTracking and stopLocationTracking
PushNotification.prototype.startGeoPushes = function(success, fail) {
	exec(success, fail, "PushNotification", "startGeoPushes", []);
};

PushNotification.prototype.stopGeoPushes = function(success, fail) {
	exec(success, fail, "PushNotification", "stopGeoPushes", []);
};

//advanced background task to track device position and not drain the battery
PushNotification.prototype.startBeaconPushes = function(success, fail) {
	exec(success, fail, "PushNotification", "startBeaconPushes", []);
};

PushNotification.prototype.stopBeaconPushes = function(success, fail) {
	exec(success, fail, "PushNotification", "stopBeaconPushes", []);
};

//Android only, let the plugin know that the app went to background mode (or vise versa)
PushNotification.prototype.setBeaconBackgroundMode = function(on, success, fail) {
	exec(success, fail, "PushNotification", "setBeaconBackgroundMode", [on]);
};

//sets multi notification mode on
PushNotification.prototype.setMultiNotificationMode = function(success, fail) {
	exec(success, fail, "PushNotification", "setMultiNotificationMode", []);
};

//sets single notification mode
PushNotification.prototype.setSingleNotificationMode = function(success, fail) {
	exec(success, fail, "PushNotification", "setSingleNotificationMode", []);
};

//type: 0 default, 1 no sound, 2 always
PushNotification.prototype.setSoundType = function(type, success, fail) {
	exec(success, fail, "PushNotification", "setSoundType", [type]);
};

//type: 0 default, 1 no vibration, 2 always
PushNotification.prototype.setVibrateType = function(type, success, fail) {
	exec(success, fail, "PushNotification", "setVibrateType", [type]);
};

PushNotification.prototype.setLightScreenOnNotification = function(on, success, fail) {
	exec(success, fail, "PushNotification", "setLightScreenOnNotification", [on]);
};

//set to enable led blinking when notification arrives and display is off
PushNotification.prototype.setEnableLED = function(on, success, fail) {
	exec(success, fail, "PushNotification", "setEnableLED", [on]);
};

//{goal:'name', count:3} (count is optional)
PushNotification.prototype.sendGoalAchieved = function(config, success, fail) {
	exec(success, fail, "PushNotification", "sendGoalAchieved", config ? [config] : []);
};

//Android Only. Gets push history, returns array
PushNotification.prototype.getPushHistory = function(success) {
	exec(success, null, "PushNotification", "getPushHistory", []);
};

//Android Only. Clears push history
PushNotification.prototype.clearPushHistory = function() {
	exec(null, null, "PushNotification", "clearPushHistory", []);
};

//Android End----

//iOS only----
// Call this to get a detailed status of remoteNotifications
PushNotification.prototype.getRemoteNotificationStatus = function(callback) {
	exec(callback, callback, "PushNotification", "getRemoteNotificationStatus", []);
};

// Call this to set the application icon badge
PushNotification.prototype.setApplicationIconBadgeNumber = function(badgeNumber, callback) {
	exec(callback, callback, "PushNotification", "setApplicationIconBadgeNumber", [{badge: badgeNumber}]);
};

// Call this to clear all notifications from the notification center
PushNotification.prototype.cancelAllLocalNotifications = function(callback) {
	exec(callback, callback, "PushNotification", "cancelAllLocalNotifications", []);
};
//iOS End----

// Event spawned when a notification is received while the application is active
PushNotification.prototype.notificationCallback = function(notification) {
	var ev = document.createEvent('HTMLEvents');
	ev.notification = notification;
	ev.initEvent('push-notification', true, true, arguments);
	document.dispatchEvent(ev);
};

module.exports = new PushNotification();
