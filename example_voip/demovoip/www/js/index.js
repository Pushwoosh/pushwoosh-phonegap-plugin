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
    }
}

function initializePushwoosh(appId, projectId) {
    console.log('Initializing Pushwoosh with App ID:', appId, 'Project ID:', projectId);

    // Set VoIP App Code
    pushwoosh.setVoipAppCode(appId);
    console.log('VoIP App Code set to:', appId);

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

    // Request Call Permission button (Android only)
    document.getElementById('btnRequestCallPermission').addEventListener('click', function() {
        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }
        pushwoosh.requestCallPermission();
        console.log('Call permission requested (Android only)');
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

    // Register for Push Notifications button (Android only)
    document.getElementById('btnRegisterPush').addEventListener('click', function() {
        if (!pushwoosh) {
            alert('Pushwoosh not initialized yet. Wait for device ready.');
            return;
        }
        pushwoosh.registerDevice(
            function(status) {
                var pushToken = status.pushToken;
                console.log('Push token received:', pushToken);
                alert('Successfully registered! Push token: ' + pushToken);
            },
            function(status) {
                console.log('Failed to register for push:', status);
                alert('Failed to register for push notifications: ' + status);
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
