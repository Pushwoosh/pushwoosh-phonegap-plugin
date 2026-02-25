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
    checkAndShowWelcomeScreen();
    setupUIEventListeners();
    setupWelcomeScreen();
});

let pushwoosh = null;

function checkAndShowWelcomeScreen() {
    const dontShowAgain = localStorage.getItem('dontShowWelcome');
    const welcomeScreen = document.getElementById('welcomeScreen');

    if (dontShowAgain === 'true') {
        welcomeScreen.classList.add('hidden');
    } else {
        welcomeScreen.classList.remove('hidden');
    }
}

function setupWelcomeScreen() {
    document.getElementById('btnGetStarted').addEventListener('click', function() {
        const dontShowCheckbox = document.getElementById('dontShowAgain');

        if (dontShowCheckbox.checked) {
            localStorage.setItem('dontShowWelcome', 'true');
        }

        document.getElementById('welcomeScreen').classList.add('hidden');
    });
}

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
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');

    pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

    registerVoIPEvents();

    // Auto-initialize with default values
    const appId = document.getElementById('pushAppId').value;
    const projectId = document.getElementById('pushProjectId').value;
    if (appId) {
        initializePushwoosh(appId, projectId);

        // Auto-call registerDevice after initialization to test callbacks
        setTimeout(function() {
            pushwoosh.registerDevice(
                function(status) {
                    var pushToken = status.pushToken;
                    console.log('PUSH TOKEN +++++++++ : ' + pushToken);
                },
                function(status) {
                    console.log('REGISTRATION ERROR: ' + JSON.stringify(status));
                }
            );
        }, 1000);
    }
}

function initializePushwoosh(appId, projectId) {
    console.log('Initializing Pushwoosh with App ID:', appId, 'Project ID:', projectId);

    // Initialize Pushwoosh
    pushwoosh.onDeviceReady({
        "appid": appId,
        "projectid": projectId || ""
    });

    pushwoosh.getPushToken(
        function(token) {
            console.log('Push Token:', token);
        }
    );

    pushwoosh.getPushwooshHWID(
        function(hwid) {
            console.log('HWID:', hwid);
        }
    );
}

function registerVoIPEvents() {
    VOIP_EVENTS.forEach(function(eventName) {
        pushwoosh.registerEvent(
            eventName,
            function(data) {
                console.log('====== VOIP EVENT CALLBACK TRIGGERED ======');
                console.log('EVENT NAME: ' + eventName);
                console.log('EVENT DATA: ' + JSON.stringify(data));
                console.log('===========================================');
                console.log('[VoIP Event] ' + eventName + ':', data);
                logEventToUI(eventName, JSON.stringify(data, null, 2));

                // Special handling for call cancellation
                if (eventName === 'voipDidCancelCall') {
                    showCancelledCallModal(data);
                }
            },
            function(error) {
                console.error('Failed to register event ' + eventName + ':', error);
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

    // Initialize VoIP Parameters button
    document.getElementById('btnInitVoIP').addEventListener('click', function() {
        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }
        initializeVoIPParameters();
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
        console.log('Call timeout set to:', timeout, 'seconds');
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
                console.log('Call permission result: ' + (granted ? 'granted' : 'denied'));
                alert('Call permission ' + (granted ? 'granted' : 'denied'));
            },
            function(error) {
                console.error('Call permission error: ', error);
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
                const statusText = 'Call Permission Status: ' + (status ? 'Granted' : 'Denied');
                document.getElementById('permissionStatus').textContent = statusText;
                console.log(statusText);
            },
            function(error) {
                const errorText = 'Error getting permission status: ' + error;
                document.getElementById('permissionStatus').textContent = errorText;
                console.log(errorText);
            }
        );
    });

    // Register for Push Notifications button
    document.getElementById('btnRegisterPush').addEventListener('click', function() {
        console.log('🔴 BUTTON CLICKED! btnRegisterPush was pressed');
        logEventToUI('🔴 Button clicked!', 'Button pressed');

        if (!pushwoosh) {
            console.log('⚠️ pushwoosh is null or undefined!');
            logEventToUI('ERROR', 'pushwoosh is null!');
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }

        console.log('🔵 Pushwoosh object:', pushwoosh);
        console.log('🔵 registerDevice type:', typeof pushwoosh.registerDevice);
        logEventToUI('DEBUG', 'pushwoosh object exists, registerDevice type: ' + typeof pushwoosh.registerDevice);

        if (!pushwoosh.registerDevice) {
            console.log('❌ registerDevice method does not exist!');
            logEventToUI('ERROR', 'registerDevice method does not exist!');
            return;
        }

        console.log('✅ About to call registerDevice...');
        logEventToUI('📱 registerDevice', 'Calling registerDevice with callbacks...');

        try {
            pushwoosh.registerDevice(
                function(status) {
                    console.log('[CALLBACK TEST] ✅ SUCCESS CALLBACK FIRED!', status);
                    logEventToUI('✅ SUCCESS callback', JSON.stringify(status, null, 2));

                    var pushToken = status.pushToken;
                    console.log('Push token received:', pushToken);
                    alert('Successfully registered! Push token: ' + pushToken);
                },
                function(status) {
                    console.log('[CALLBACK TEST] ❌ ERROR CALLBACK FIRED!', status);
                    logEventToUI('❌ ERROR callback', JSON.stringify(status, null, 2));
                    alert('Failed to register for push notifications: ' + JSON.stringify(status));
                }
            );
            console.log('✅ registerDevice call completed (call was made, waiting for callback...)');
            logEventToUI('✅ registerDevice called', 'Method invoked successfully, waiting for response...');
        } catch (e) {
            console.log('💥 EXCEPTION calling registerDevice:', e);
            logEventToUI('💥 EXCEPTION', 'Error: ' + e.message);
        }

        // Log after 3 seconds if no callback fired
        setTimeout(function() {
            console.log('[CALLBACK TEST] 3 seconds passed - checking if callbacks fired...');
            logEventToUI('⏰ 3 seconds passed', 'If no SUCCESS/ERROR callback above, callbacks did NOT fire!');
        }, 3000);
    });

    // Get Notification Status button
    document.getElementById('btnGetNotificationStatus').addEventListener('click', function() {
        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }
        pushwoosh.getRemoteNotificationStatus(
            function(status) {
                console.log('Notification status:', status);

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
                var errorText = 'Error getting notification status: ' + error;
                document.getElementById('notificationStatus').textContent = errorText;
                console.error(errorText);
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
                console.log('Call ended successfully');
            },
            function(error) {
                console.log('Failed to end call: ' + error);
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

function initializeVoIPParameters() {
    const supportsVideo = document.getElementById('supportsVideo').checked;
    const ringtoneSound = document.getElementById('ringtoneSound').value;
    const handleType = parseInt(document.getElementById('handleType').value);

    console.log('Initializing VoIP with parameters:', {
        supportsVideo: supportsVideo,
        ringtoneSound: ringtoneSound,
        handleType: handleType
    });

    pushwoosh.initializeVoIPParameters(
        supportsVideo,
        ringtoneSound,
        handleType,
        function() {
            console.log('VoIP parameters initialized successfully');
        },
        function(error) {
            console.log('Failed to initialize VoIP parameters:', error);
        }
    );
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

function showCancelledCallModal(voipMessage) {
    const modal = document.getElementById('cancelledCallModal');

    // Map handle type to readable text
    const handleTypeMap = {
        1: 'Generic',
        2: 'Phone Number',
        3: 'Email Address'
    };

    // Update modal content with call data
    document.getElementById('cancelledCallerName').textContent = voipMessage.callerName || 'Unknown';
    document.getElementById('cancelledCallId').textContent = voipMessage.callId || 'N/A';
    document.getElementById('cancelledHandleType').textContent = handleTypeMap[voipMessage.handleType] || 'Unknown';
    document.getElementById('cancelledHasVideo').textContent = voipMessage.hasVideo ? 'Yes' : 'No';

    // Show modal
    modal.classList.remove('hidden');

    // Setup dismiss button if not already done
    const dismissBtn = document.getElementById('btnDismissCancelledCall');
    if (!dismissBtn.hasListener) {
        dismissBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
        dismissBtn.hasListener = true;
    }
}
