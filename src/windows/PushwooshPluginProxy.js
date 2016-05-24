var cordova = require('cordova'),
	pushwooshPlugin= require('./PushNotification');


	var platform = require('cordova/platform');

module.exports = {

	onDeviceReady : function(success, fail, config) {
		this.service = new PushSDK.NotificationService.getCurrent(config[0].appid);

		var startPushData = null;
	   
		if (platform.activationContext && platform.activationContext.args) {
			startPushData = platform.activationContext.args;
		}
	 
		if (startPushData !== null)
			PushSDK.NotificationService.handleStartPush(startPushData);

		success();
	},

	registerDevice: function (success, fail) {
		if (!this.service) {
			// postpone
			setTimeout(function () { registerDevice(success, fail) }, 1000);
		}

		this.service.ononpushtokenreceived = success;

		this.service.ononpushtokenfailed = fail;

		this.service.ononpushaccepted = function (args) {
			setTimeout(function() { cordova.require("pushwoosh-cordova-plugin.PushNotification").notificationCallback(args); }, 0);
		}

		this.service.subscribeToPushService();
	},

	unregisterDevice: function(success, fail) {
		this.service.unsubscribeFromPushes();
		success();
	},

	getPushwooshHWID: function (success) {
		success(this.service.deviceUniqueID);
	},

	getPushToken: function(success) {
		success(this.service.pushToken);
	},

	startLocationTracking: function(success, fail) {
		this.service.startGeoLocation();
		success();
	},

	stopLocationTracking: function(success, fail) {
		this.service.stopLocationTracking();
		success();
	}
};

require("cordova/exec/proxy").add("PushNotification", module.exports);
