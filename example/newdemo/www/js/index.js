/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    var pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');

    pushwooshInitialize(pushwoosh);

    registerForPushNotificationAction(pushwoosh);

    setTagsAction(pushwoosh);
    setLanguageAction(pushwoosh);
    setUserIdAction(pushwoosh);
    sendPostEventAction(pushwoosh);

    getTagsAction(pushwoosh);
    getPushTokenAction(pushwoosh);
    getPushwooshHWIDAction(pushwoosh);

    sendLocalNotificationAction(pushwoosh);
    clearNotificationCenterAction(pushwoosh);
}

function setTagsAction(pushwoosh) {
    document.getElementById('setTags').addEventListener('click', function() {
        var key = document.getElementById("textField1").value;
        var value = document.getElementById("textField2").value;
/**
 *  Function: setTags
 *  [android, ios, wp8, windows] Set tags for the device
 *
 *  Parameters:
 *  "config" - object with custom device tags
 *  "success" - success callback
 *  "fail" - error callback
 * 
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */
        pushwoosh.setTags({key: key, value: value},
            function() {
                console.warn('setTags success');
            },
            function(error) {
                console.warn('setTags failed');
            })
    });
}

function setLanguageAction(pushwoosh) {
    document.getElementById('setLangBtn').addEventListener('click', function() {
        var language = document.getElementById('textField3').value;

/**
 * [android, ios] Set custom application language (as opposed to the default system language).
 * This allows sending localized push messages
 * 
 * Parameters:
 * "language" - string containing language code, i.e. "en", "fr"
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */
        pushwoosh.setLanguage(language);
    });
}

function setUserIdAction(pushwoosh) {
    document.getElementById('setUserBtn').addEventListener('click', function() {
        var userId = document.getElementById('textField4').value;

/**
 * Function: setUserId
 * [android, ios] Set User indentifier. This could be Facebook ID, username or email, or any other user ID.
 * This allows data and events to be matched across multiple user devices.
 * 
 * Parameters:
 * "userId" - user string identifier
 * 
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */
        pushwoosh.setUserId(userId);
    });
}

function sendPostEventAction(pushwoosh) {
    document.getElementById('setPostEventBtn').addEventListener('click', function() {
        var eventName = document.getElementById("textField5").value;

/**
 * Function: postEvent
 * [android, ios] Post events for In-App Messages. This can trigger In-App message display as specified in Pushwoosh Control Panel.
 * 
 * Parameters:
 * "event" - event to trigger
 * "attributes" - object with additional event attributes
 * 
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */

        pushwoosh.postEvent(eventName, { "buttonNumber" : 4, "buttonLabel" : "banner" });
    });
}

function getTagsAction(pushwoosh) {
    document.getElementById('getTags').addEventListener('click', function() {
/**
 * Function: getTags
 * [android, ios, wp8, windows] Returns tags for the device including default tags
 * 
 * Parameters:
 * "success" - success callback. Receives tags as parameter
 * "fail" - error callback
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */
        pushwoosh.getTags(
            function(tags) {
                console.log('tags for device: ' + JSON.stringify(tags));
            },
            function(error) {
                console.log('get tags error: ' + JSON.stringify(error));
            }
        );
    }, false);
}

function getPushTokenAction(pushwoosh) {
    document.getElementById('getPushToken').addEventListener('click', function() {

/**
 * Function: getPushToken
 * [android, ios, wp8, windows] Returns push token if it is available. Note the token also comes in registerDevice function callback.
 * 
 * Parameters:
 * "success" - getPushToken callback
 * 
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */
        pushwoosh.getPushToken(
            function(token) {
                console.log('push token: ', + token);
            }
        );
    }, false);
}

function getPushwooshHWIDAction(pushwoosh) {
    document.getElementById('getHwid').addEventListener('click', function() {

 /**
 * Function: getPushwooshHWID
 * [android, ios, wp8, windows] Returns Pushwoosh HWID used for communications with Pushwoosh API
 * 
 * Parameters:
 * "success" - getPushwooshHWID callback
 * 
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */
        pushwoosh.getPushwooshHWID(
            function(token) {
                console.log('Pushwoosh HWID: ' + token);
            }
        );
    });
}

function resetBadges(pushwoosh) {
    document.getElementById('resetBadges').addEventListener('click', function() {

 /**
 * Function: setApplicationIconBadgeNumber
 * [android, ios, wp8, windows] Set the application icon badge number
 * 
 * Parameters:
 * "badgeNumber" - icon badge number
 * 
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */

        pushwoosh.setApplicationIconBadgeNumber('0');
    });
}

function sendLocalNotificationAction(pushwoosh) {
    document.getElementById('localNotification').addEventListener('click', function() {

/**
 * Function: createLocalNotification
 * [android, ios] Schedules local notification.
 * 
 * Parameters:
 * "config.msg" - notification message
 * "config.seconds" - notification delay in seconds
 * "config.userData" - addition data to pass in notification
 * "success" - success callback
 * "fail" - error callback
 * 
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */

        pushwoosh.createLocalNotification({msg: 'Hello, Pushwoosh!', seconds: 5, userData: 'optional'});
    });
}

function clearNotificationCenterAction(pushwoosh) {
    document.getElementById('clearNotificationCenter').addEventListener('click', function() {

/**
 * Function: cancelAllLocalNotifications
 * [ios] Clears all notifications from the notification center
 * 
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */

        pushwoosh.cancelAllLocalNotifications();
    });
}

function registerForPushNotificationAction(pushwoosh) {
    var switcher = document.getElementById("switcher");

    switcher.addEventListener("change", function () {
        // Register for Push Notifications
        if (this.checked) {

/**
 * Function: registerDevice
 * [android, ios, wp8, windows] Register device for push notifications and retreive a push Token
 * 
 * Parameters:
 * "success" - success callback. Push token is passed as "status.pushToken" parameter to this callback
 * "fail" - error callback
 * 
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */

            pushwoosh.registerDevice(
                function (status) {
                    var pushToken = status.pushToken;
                    // Handle successful registration here
                    console.log('Push token received: ', pushToken);
                },
                function (status) {
                    // Handle registration error here
                    console.error('Push registration failed: ', status);
                }
            );
        } else {

/**
 * Function: unregisterDevice
 * [android, ios, wp8, windows] Unregister device form receiving push notifications
 * 
 * Parameters:
 * "success" - success callback
 * "fail" - error callback
 * 
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */

            pushwoosh.unregisterDevice(
                function (status) {
                    console.log('Success', status);
                },
                function (status) {
                    console.error('Fail', status);
                }
            );
        }
    });
}

function pushwooshInitialize(pushwoosh) {
    // Should be called before pushwoosh.onDeviceReady
    document.addEventListener('push-notification', function (event) {
        var notification = event.notification;
        // Handle push open here
        console.log('Received push notification: ', notification);
    });

/**
 * Function: onDeviceReady
 * [android, ios, wp8, windows] Initialize Pushwoosh plugin and trigger a start push message
 * Should be called on every app launch
 * 
 * Parameters:
 * "config.appid" - Pushwoosh application code
 * "config.projectid" - GCM project number for android platform
 * "config.serviceName" - MPNS service name for wp8 platform
 * 
 * initialize Pushwoosh with projectid: 
 * "GOOGLE_PROJECT_NUMBER", appid : "PUSHWOOSH_APP_ID", serviceName : "WINDOWS_PHONE_SERVICE". 
 * This will trigger all pending push notifications on start.
 *           |    |
 *           |    |
 *         __|    |__
 *         \        /
 *          \      /
 *           \    /
 *            \__/
 */
    pushwoosh.onDeviceReady({        
        appid: "XXXXX-XXXXX",
        projectid: "XXXXXXXXXXXXXXX",
        serviceName: "XXXX"
    });
}