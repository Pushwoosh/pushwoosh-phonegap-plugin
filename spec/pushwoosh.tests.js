/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var PushNotification;

describe('cordova.require object should exist', function () {
	it("should exist", function() {
        expect(window.cordova).toBeDefined();
        expect(typeof cordova.require == 'function').toBe(true);
	});

	it("Pushwoosh plugin should exist", function() {
        PushNotification = cordova.require("cordova/plugin/Pushwoosh");
        expect(PushNotification).toBeDefined();
		expect(typeof PushNotification == 'object').toBe(true);
	});

    it("should contain a registerDevice function", function() {
        expect(PushNotification.registerDevice).toBeDefined();
        expect(typeof PushNotification.registerDevice == 'function').toBe(true);
    });

    it("should contain an setTags function", function() {
        expect(PushNotification.setTags).toBeDefined();
        expect(typeof PushNotification.setTags == 'function').toBe(true);
    });

    it("should contain an getTags function", function() {
        expect(PushNotification.getTags).toBeDefined();
        expect(typeof PushNotification.getTags == 'function').toBe(true);
    });

    it("should contain an sendLocation function", function() {
        expect(PushNotification.sendLocation).toBeDefined();
        expect(typeof PushNotification.sendLocation == 'function').toBe(true);
    });

    it("should contain an onDeviceReady function", function() {
        expect(PushNotification.onDeviceReady).toBeDefined();
        expect(typeof PushNotification.onDeviceReady == 'function').toBe(true);
    });

    it("should contain an unregisterDevice function", function() {
        expect(PushNotification.unregisterDevice).toBeDefined();
        expect(typeof PushNotification.unregisterDevice == 'function').toBe(true);
    });

    it("should contain an createLocalNotification function", function() {
        expect(PushNotification.createLocalNotification).toBeDefined();
        expect(typeof PushNotification.createLocalNotification == 'function').toBe(true);
    });

    it("should contain an clearLocalNotification function", function() {
        expect(PushNotification.clearLocalNotification).toBeDefined();
        expect(typeof PushNotification.clearLocalNotification == 'function').toBe(true);
    });

    it("should contain an startGeoPushes function", function() {
        expect(PushNotification.startGeoPushes).toBeDefined();
        expect(typeof PushNotification.startGeoPushes == 'function').toBe(true);
    });

    it("should contain an stopGeoPushes function", function() {
        expect(PushNotification.stopGeoPushes).toBeDefined();
        expect(typeof PushNotification.stopGeoPushes == 'function').toBe(true);
    });

    it("should contain an setMultiNotificationMode function", function() {
        expect(PushNotification.setMultiNotificationMode).toBeDefined();
        expect(typeof PushNotification.setMultiNotificationMode == 'function').toBe(true);
    });

    it("should contain an setSingleNotificationMode function", function() {
        expect(PushNotification.setSingleNotificationMode).toBeDefined();
        expect(typeof PushNotification.setSingleNotificationMode == 'function').toBe(true);
    });

    it("should contain an setSoundType function", function() {
        expect(PushNotification.setSoundType).toBeDefined();
        expect(typeof PushNotification.setSoundType == 'function').toBe(true);
    });

    it("should contain an setVibrateType function", function() {
        expect(PushNotification.setVibrateType).toBeDefined();
        expect(typeof PushNotification.setVibrateType == 'function').toBe(true);
    });

    it("should contain an setLightScreenOnNotification function", function() {
        expect(PushNotification.setLightScreenOnNotification).toBeDefined();
        expect(typeof PushNotification.setLightScreenOnNotification == 'function').toBe(true);
    });

    it("should contain an setEnableLED function", function() {
        expect(PushNotification.setEnableLED).toBeDefined();
        expect(typeof PushNotification.setEnableLED == 'function').toBe(true);
    });

    it("should contain an sendGoalAchieved function", function() {
        expect(PushNotification.sendGoalAchieved).toBeDefined();
        expect(typeof PushNotification.sendGoalAchieved == 'function').toBe(true);
    });

    it("should contain an startLocationTracking function", function() {
        expect(PushNotification.startLocationTracking).toBeDefined();
        expect(typeof PushNotification.startLocationTracking == 'function').toBe(true);
    });

    it("should contain an stopLocationTracking function", function() {
        expect(PushNotification.stopLocationTracking).toBeDefined();
        expect(typeof PushNotification.stopLocationTracking == 'function').toBe(true);
    });

    it("should contain an getRemoteNotificationStatus function", function() {
        expect(PushNotification.getRemoteNotificationStatus).toBeDefined();
        expect(typeof PushNotification.getRemoteNotificationStatus == 'function').toBe(true);
    });

    it("should contain an setApplicationIconBadgeNumber function", function() {
        expect(PushNotification.setApplicationIconBadgeNumber).toBeDefined();
        expect(typeof PushNotification.setApplicationIconBadgeNumber == 'function').toBe(true);
    });

    it("should contain an cancelAllLocalNotifications function", function() {
        expect(PushNotification.cancelAllLocalNotifications).toBeDefined();
        expect(typeof PushNotification.cancelAllLocalNotifications == 'function').toBe(true);
    });

    it("should contain an notificationCallback function", function() {
        expect(PushNotification.notificationCallback).toBeDefined();
        expect(typeof PushNotification.notificationCallback == 'function').toBe(true);
    });

});
