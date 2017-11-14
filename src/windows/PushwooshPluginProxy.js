var cordova = require('cordova'),
    pushwooshPlugin = require('./PushNotification');


var platform = require('cordova/platform');

module.exports = {

    onDeviceReady: function (success, fail, config) {
        this.service = new PushSDK.NotificationService.getCurrent(config[0].appid);

        var startPushData = null;

        if (platform.activationContext && platform.activationContext.args) {
            startPushData = platform.activationContext.args;
        }

        if (startPushData !== null)
            PushSDK.NotificationService.handleStartPush(startPushData);

        success();
    },

    onAppActivated: function (success, fail, args) {
        if (args !== null && args.length > 0)
            PushSDK.NotificationService.handleStartPush(args[0]);
    },

    registerDevice: function (success, fail) {
        if (!this.service) {
            // postpone
            setTimeout(function () { this.registerDevice(success, fail) }, 1000);
        }

        this.service.ononpushtokenreceived = function (token) {
            success({ "pushToken": token });
        };

        this.service.ononpushtokenfailed = fail;

        this.service.ononpushreceived = function (args) {
            var unifiedPush = { "onStart": args.onStart, "foreground": !args.onStart, "userdata": JSON.parse(args.userData), "windows": args };
            setTimeout(function () { cordova.require("pushwoosh-cordova-plugin.PushNotification").pushReceivedCallback(unifiedPush); }, 0);
        }

        this.service.ononpushaccepted = function (args) {
            var unifiedPush = { "onStart": args.onStart, "foreground": !args.onStart, "userdata": JSON.parse(args.userData), "windows": args };
            setTimeout(function () { cordova.require("pushwoosh-cordova-plugin.PushNotification").notificationCallback(unifiedPush); }, 0);
        }

        this.service.subscribeToPushService();
    },

    unregisterDevice: function (success, fail) {
        this.service.unsubscribeFromPushes(function () { success(); }, fail);
    },

    getPushwooshHWID: function (success) {
        success(this.service.deviceUniqueID);
    },

    getPushToken: function (success) {
        success(this.service.pushToken);
    },

    startLocationTracking: function (success, fail) {
        this.service.startGeoLocation();
        success();
    },

    stopLocationTracking: function (success, fail) {
        this.service.stopLocationTracking();
        success();
    },

    getTags: function (success, fail) {
        this.service.getTags(
            function (sender, tagsString) {
                var tags = JSON.parse(tagsString);
                success(tags);
            },
            function (sender, error) {
                fail(error);
            }
        );
    },

    setTags: function (success, fail, tags) {
        var keys = [];
        var values = [];

        for (key in tags[0]) {
            keys.push(key);
            values.push(tags[0][key]);
        }

        this.service.sendTag(keys, values, null, null);
        success();
    },

    setApplicationIconBadgeNumber: function (success, fail, config) {
        var badge = config[0]["badge"];
        this.service.setBadgeNumber(badge);
    }
};

require("cordova/exec/proxy").add("PushNotification", module.exports);