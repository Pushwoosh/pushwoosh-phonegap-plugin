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

document.addEventListener('deviceready', onDeviceReady, false);

document.addEventListener('DOMContentLoaded', function() {
    setupUIEventListeners();
});

let pushwoosh = null;
const TAG = '[1st ACTIVITY VIEW]';

// VoIP event names
const VOIP_EVENTS = [
    'voipPushPayload',
    'answer',
    'reject',
    'hangup',
    'muted',
    'unmuted',
    'held',
    'unheld',
    'dtmf',
    'audioInterruption',
    'callFailed',
    'providerDidActivate',
    'providerDidDeactivate',
    'incomingCallSuccess',
    'incomingCallFailure',
    'playDTMF',
    'voipDidFailToRegisterTokenWithError',
    'voipDidRegisterTokenSuccessfully',
    'voipDidCancelCall',
    'voipDidFailToCancelCall'
];

function onDeviceReady() {
    console.log(TAG + '[DEVICE_READY] cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');

    pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

    registerVoIPEvents();
    setupPushNotificationEvents();

    // Auto-initialize with default values
    const appId = document.getElementById('pushAppId').value;
    const projectId = document.getElementById('pushProjectId').value;
    if (appId) {
        initializePushwoosh(appId, projectId);

        // Auto-call registerDevice after initialization to test callbacks
        setTimeout(function() {
            pushwoosh.registerDevice(
                function(status) {
                    console.log(TAG + '[REGISTER_DEVICE] success: pushToken=' + status.pushToken);
                },
                function(status) {
                    console.log(TAG + '[REGISTER_DEVICE] error: ' + JSON.stringify(status));
                }
            );
        }, 1000);
    }
}

function setupPushNotificationEvents() {
    document.addEventListener('push-notification', function(event) {
        var notification = event.notification;
        console.log(TAG + '[PUSH_NOTIFICATION] opened: ' + JSON.stringify(notification));
        logEventToUI('push-notification', JSON.stringify(notification, null, 2));
    });

    document.addEventListener('push-receive', function(event) {
        var notification = event.notification;
        console.log(TAG + '[PUSH_RECEIVE] ' + JSON.stringify(notification));
        logEventToUI('push-receive', JSON.stringify(notification, null, 2));
    });
}

function initializePushwoosh(appId, projectId) {
    console.log(TAG + '[INIT_PUSHWOOSH] appId=' + appId + ', projectId=' + (projectId || ''));

    // Initialize Pushwoosh
    pushwoosh.onDeviceReady({
        "appid": appId,
        "projectid": projectId || ""
    });

    // Auto-initialize VoIP parameters with defaults
    pushwoosh.initializeVoIPParameters(
        true,       // supportsVideo
        "ring.caf", // ringtoneSound
        2,          // handleType: Phone Number
        function() {
            console.log(TAG + '[INIT_VOIP] success');
            logEventToUI('initVoIP', 'VoIP parameters initialized automatically');
        },
        function(error) {
            console.log(TAG + '[INIT_VOIP] error: ' + error);
            logEventToUI('initVoIP ERROR', error);
        }
    );

    pushwoosh.getPushToken(
        function(token) {
            console.log(TAG + '[GET_PUSH_TOKEN] ' + token);
        }
    );

    pushwoosh.getPushwooshHWID(
        function(hwid) {
            console.log(TAG + '[GET_HWID] ' + hwid);
        }
    );
}

function registerVoIPEvents() {
    VOIP_EVENTS.forEach(function(eventName) {
        pushwoosh.registerEvent(
            eventName,
            function(data) {
                console.log(TAG + '[' + eventName.toUpperCase() + '] ' + JSON.stringify(data));
                logEventToUI(eventName, JSON.stringify(data, null, 2));

            },
            function(error) {
                console.error(TAG + '[REGISTER_EVENT] error: event=' + eventName + ', ' + error);
            }
        );
    });
}

function setupUIEventListeners() {
    // Initialize Pushwoosh button
    document.getElementById('btnInitPushwoosh').addEventListener('click', function() {
        const appId = document.getElementById('pushAppId').value;
        const projectId = document.getElementById('pushProjectId').value;

        if (!appId) {
            alert('Please enter App ID');
            return;
        }

        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }

        initializePushwoosh(appId, projectId);
    });

    // Set Call Timeout button
    document.getElementById('btnSetCallTimeout').addEventListener('click', function() {
        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }

        const timeout = parseFloat(document.getElementById('callTimeout').value);

        if (isNaN(timeout) || timeout <= 0) {
            alert('Please enter a valid timeout value (greater than 0)');
            return;
        }

        pushwoosh.setIncomingCallTimeout(timeout);
        console.log(TAG + '[SET_CALL_TIMEOUT] ' + timeout + 's');
        alert('Incoming call timeout set to ' + timeout + ' seconds');
    });

    // Request Call Permission button (Android only)
    document.getElementById('btnRequestCallPermission').addEventListener('click', function() {
        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }
        pushwoosh.requestCallPermission(
            function(granted) {
                console.log(TAG + '[REQUEST_CALL_PERMISSION] granted=' + granted);
                alert('Call permission ' + (granted ? 'granted' : 'denied'));
            },
            function(error) {
                console.log(TAG + '[REQUEST_CALL_PERMISSION] error: ' + error);
                alert('Call permission error: ' + error);
            }
        );
    });

    // Get Call Permission Status button
    document.getElementById('btnGetCallPermissionStatus').addEventListener('click', function() {
        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }
        pushwoosh.getCallPermissionStatus(
            function(status) {
                var statusText = 'Call Permission Status: ' + (status ? 'Granted' : 'Denied');
                document.getElementById('permissionStatus').textContent = statusText;
                console.log(TAG + '[GET_CALL_PERMISSION] ' + statusText);
            },
            function(error) {
                var errorText = 'Error getting permission status: ' + error;
                document.getElementById('permissionStatus').textContent = errorText;
                console.log(TAG + '[GET_CALL_PERMISSION] error: ' + error);
            }
        );
    });

    // Register for Push Notifications button
    document.getElementById('btnRegisterPush').addEventListener('click', function() {
        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }

        console.log(TAG + '[REGISTER_DEVICE] calling...');
        logEventToUI('registerDevice', 'Calling registerDevice...');

        pushwoosh.registerDevice(
            function(status) {
                console.log(TAG + '[REGISTER_DEVICE] success: pushToken=' + status.pushToken);
                logEventToUI('registerDevice OK', JSON.stringify(status, null, 2));
            },
            function(error) {
                console.log(TAG + '[REGISTER_DEVICE] error: ' + JSON.stringify(error));
                logEventToUI('registerDevice ERROR', JSON.stringify(error, null, 2));
            }
        );
    });

    // Get Notification Status button
    document.getElementById('btnGetNotificationStatus').addEventListener('click', function() {
        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }
        pushwoosh.getRemoteNotificationStatus(
            function(status) {
                console.log(TAG + '[GET_NOTIFICATION_STATUS] ' + JSON.stringify(status));

                var statusText = 'Notification Status:\n';
                statusText += 'Enabled: ' + (status.enabled || '0') + '\n';
                statusText += 'Push Alert: ' + (status.pushAlert || '0') + '\n';
                statusText += 'Push Badge: ' + (status.pushBadge || '0') + '\n';
                statusText += 'Push Sound: ' + (status.pushSound || '0');

                if (status.time_sensitive_notifications !== undefined) {
                    statusText += '\nTime Sensitive: ' + status.time_sensitive_notifications;
                }
                if (status.scheduled_summary !== undefined) {
                    statusText += '\nScheduled Summary: ' + status.scheduled_summary;
                }

                document.getElementById('notificationStatus').textContent = statusText;
                logEventToUI('getRemoteNotificationStatus', JSON.stringify(status, null, 2));
            },
            function(error) {
                console.log(TAG + '[GET_NOTIFICATION_STATUS] error: ' + error);
                document.getElementById('notificationStatus').textContent = 'Error: ' + error;
            }
        );
    });

    // End Call button
    document.getElementById('btnEndCall').addEventListener('click', function() {
        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }
        pushwoosh.endCall(
            function() {
                console.log(TAG + '[END_CALL] success');
                logEventToUI('endCall', 'Call ended successfully');
            },
            function(error) {
                console.log(TAG + '[END_CALL] error: ' + error);
                logEventToUI('endCall ERROR', error);
            }
        );
    });

    // Open Second WebView button
    document.getElementById('btnOpenSecondWebView').addEventListener('click', function() {
        if (!window.SecondWebView) {
            alert('SecondWebView plugin not installed. Rebuild after adding the plugin.');
            return;
        }
        logEventToUI('SecondWebView', 'Opening second WebView...');
        SecondWebView.open(
            function(msg) {
                logEventToUI('SecondWebView', 'Opened: ' + msg);
            },
            function(err) {
                logEventToUI('SecondWebView ERROR', err);
            }
        );
    });

    // Clear Log button
    document.getElementById('btnClearLog').addEventListener('click', function() {
        document.getElementById('eventLog').innerHTML = '';
    });
}

function logEventToUI(eventName, data) {
    const timestamp = new Date().toLocaleTimeString();

    const eventLog = document.getElementById('eventLog');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';

    logEntry.innerHTML =
        '<span class="timestamp">[' + timestamp + ']</span>' +
        '<span class="event-name">' + eventName + '</span>' +
        '<br/>' +
        '<span class="event-data">' + (data || '') + '</span>';

    eventLog.insertBefore(logEntry, eventLog.firstChild);

    while (eventLog.children.length > 50) {
        eventLog.removeChild(eventLog.lastChild);
    }
}

