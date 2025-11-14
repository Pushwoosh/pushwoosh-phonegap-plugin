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
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    var pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    pushwooshInitialize(pushwoosh);

    // VoIP initialization
    pushwoosh.setVoipAppCode("7BCDB-76CBE");
    pushwoosh.initializeVoIPParameters(true, "ring.caf", 2, function(success) {
        console.log("VoIP Success:", success);
    }, function(error) {
        console.error("VoIP Error:", error);
    });

    pushwoosh.requestCallPermission();

    // VoIP event listeners
    pushwoosh.registerEvent("answer",
        function(payload){
            console.log("Answer call from " + payload.callerName);
        },
        function(error) {
            console.log("Answer ERROR:", error);
        }
    );

    pushwoosh.registerEvent("reject",
        function(payload){
            console.log("Reject call from " + payload.callerName);
        },
        function(error) {
            console.log("Reject ERROR:", error);
        }
    );

    pushwoosh.registerEvent("hangup",
        function(payload){
            console.log("Hangup call from " + payload.callerName);
        },
        function(error) {
            console.log("Hangup ERROR:", error);
        }
    );

    pushwoosh.registerEvent("voipPushPayload",
        function(payload){
            console.log("Received call with " + JSON.stringify(payload));
        },
        function(error) {
            console.log("VoIP Payload ERROR:", error);
        }
    );

    // Setup all action handlers
    registerForPushNotificationAction(pushwoosh);
    setupNotificationStatusAction(pushwoosh);
    endCallAction(pushwoosh);
    setTagsAction(pushwoosh);
    setLanguageAction(pushwoosh);
    setUserIdAction(pushwoosh);
    sendPostEventAction(pushwoosh);
    getTagsAction(pushwoosh);
    getPushTokenAction(pushwoosh);
    getPushwooshHWIDAction(pushwoosh);
    sendLocalNotificationAction(pushwoosh);
    clearNotificationCenterAction(pushwoosh);
    resetBadges(pushwoosh);
    setupModalHandlers();
}

// Setup modal close handlers
function setupModalHandlers() {
    var modal = document.getElementById('statusModal');
    var closeBtn = document.getElementById('closeModal');

    closeBtn.onclick = function() {
        modal.classList.remove('show');
    };

    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    };
}

// Show modal with notification status
function showStatusModal(status) {
    var modal = document.getElementById('statusModal');
    var modalBody = document.getElementById('modalBody');

    var html = '';

    if (status && typeof status === 'object') {
        // Order the keys for better display
        var orderedKeys = [
            'enabled',
            'pushToken',
            'userId',
            'pushBadge',
            'pushAlert',
            'pushSound'
        ];

        orderedKeys.forEach(function(key) {
            if (status.hasOwnProperty(key)) {
                var value = status[key];
                var valueClass = '';
                var displayValue = value;

                // Format boolean values
                if (typeof value === 'boolean') {
                    displayValue = value ? 'Enabled' : 'Disabled';
                    valueClass = value ? 'enabled' : 'disabled';
                }

                // Format label
                var label = key.charAt(0).toUpperCase() + key.slice(1)
                    .replace(/([A-Z])/g, ' $1')
                    .trim();

                html += '<div class="status-item">';
                html += '<span class="status-label">' + label + '</span>';
                html += '<span class="status-value ' + valueClass + '">' + displayValue + '</span>';
                html += '</div>';
            }
        });

        // Add any remaining keys not in orderedKeys
        for (var key in status) {
            if (status.hasOwnProperty(key) && orderedKeys.indexOf(key) === -1) {
                var value = status[key];
                var label = key.charAt(0).toUpperCase() + key.slice(1)
                    .replace(/([A-Z])/g, ' $1')
                    .trim();

                html += '<div class="status-item">';
                html += '<span class="status-label">' + label + '</span>';
                html += '<span class="status-value">' + value + '</span>';
                html += '</div>';
            }
        }
    } else {
        html = '<div class="status-item"><span class="status-label">Error</span><span class="status-value">No data available</span></div>';
    }

    modalBody.innerHTML = html;
    modal.classList.add('show');
}

// Get Remote Notification Status action
function setupNotificationStatusAction(pushwoosh) {
    document.getElementById('getNotificationStatus').addEventListener('click', function() {
        var modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = '<div class="loading">Loading notification status</div>';
        document.getElementById('statusModal').classList.add('show');

        pushwoosh.getRemoteNotificationStatus(
            function(status) {
                console.log('Notification status:', JSON.stringify(status));
                showStatusModal(status);
            },
            function(error) {
                console.error('Failed to get notification status:', error);
                showStatusModal({ error: error || 'Failed to get status' });
            }
        );
    });
}

function endCallAction(pushwoosh) {
    document.getElementById('endCall').addEventListener('click', function() {
        pushwoosh.endCall(
            function() {
                console.log('endCall success');
                alert('Call ended successfully');
            },
            function(error) {
                console.warn('endCall failed:', error);
                alert('Failed to end call: ' + error);
            });
    });
}

function setTagsAction(pushwoosh) {
    document.getElementById('setTags').addEventListener('click', function() {
        var key = document.getElementById("textField1").value;
        var value = document.getElementById("textField2").value;

        if (!key || !value) {
            alert('Please enter both key and value');
            return;
        }

        var tags = {};
        tags[key] = value;

        pushwoosh.setTags(tags,
            function() {
                console.log('setTags success');
                alert('Tags set successfully');
                document.getElementById("textField1").value = '';
                document.getElementById("textField2").value = '';
            },
            function(error) {
                console.warn('setTags failed:', error);
                alert('Failed to set tags: ' + error);
            });
    });
}

function setLanguageAction(pushwoosh) {
    document.getElementById('setLangBtn').addEventListener('click', function() {
        var language = document.getElementById('textField3').value;

        if (!language) {
            alert('Please enter a language code');
            return;
        }

        pushwoosh.setLanguage(language);
        console.log('Language set to:', language);
        alert('Language set to: ' + language);
        document.getElementById('textField3').value = '';
    });
}

function setUserIdAction(pushwoosh) {
    document.getElementById('setUserBtn').addEventListener('click', function() {
        var userId = document.getElementById('textField4').value;

        if (!userId) {
            alert('Please enter a user ID');
            return;
        }

        pushwoosh.setUserId(userId);
        console.log('User ID set to:', userId);
        alert('User ID set to: ' + userId);
        document.getElementById('textField4').value = '';
    });
}

function sendPostEventAction(pushwoosh) {
    document.getElementById('setPostEventBtn').addEventListener('click', function() {
        var eventName = document.getElementById("textField5").value;

        if (!eventName) {
            alert('Please enter an event name');
            return;
        }

        pushwoosh.postEvent(eventName, { "buttonNumber": 4, "buttonLabel": "banner" });
        console.log('Event posted:', eventName);
        alert('Event posted: ' + eventName);
        document.getElementById("textField5").value = '';
    });
}

function getTagsAction(pushwoosh) {
    document.getElementById('getTags').addEventListener('click', function() {
        pushwoosh.getTags(
            function(tags) {
                console.log('tags for device:', JSON.stringify(tags));
                var tagsStr = JSON.stringify(tags, null, 2);
                alert('Device Tags:\n' + tagsStr);
            },
            function(error) {
                console.log('get tags error:', JSON.stringify(error));
                alert('Failed to get tags: ' + error);
            }
        );
    }, false);
}

function getPushTokenAction(pushwoosh) {
    document.getElementById('getPushToken').addEventListener('click', function() {
        pushwoosh.getPushToken(
            function(token) {
                console.log('push token:', token);
                alert('Push Token:\n' + token);
            }
        );
    }, false);
}

function getPushwooshHWIDAction(pushwoosh) {
    document.getElementById('getHwid').addEventListener('click', function() {
        pushwoosh.getPushwooshHWID(
            function(hwid) {
                console.log('Pushwoosh HWID:', hwid);
                alert('Pushwoosh HWID:\n' + hwid);
            }
        );
    });
}

function resetBadges(pushwoosh) {
    document.getElementById('resetBadges').addEventListener('click', function() {
        pushwoosh.setApplicationIconBadgeNumber(0);
        console.log('Badges reset');
        alert('Badges reset to 0');
    });
}

function sendLocalNotificationAction(pushwoosh) {
    document.getElementById('localNotification').addEventListener('click', function() {
        pushwoosh.createLocalNotification({
            msg: 'Hello from Pushwoosh!',
            seconds: 5,
            userData: 'optional'
        });
        console.log('Local notification scheduled for 5 seconds');
        alert('Local notification will appear in 5 seconds');
    });
}

function clearNotificationCenterAction(pushwoosh) {
    document.getElementById('clearNotificationCenter').addEventListener('click', function() {
        pushwoosh.cancelAllLocalNotifications();
        console.log('Notification center cleared');
        alert('Notification center cleared');
    });
}

function registerForPushNotificationAction(pushwoosh) {
    var switcher = document.getElementById("switcher");

    switcher.addEventListener("change", function () {
        if (this.checked) {
            // Register for Push Notifications
            pushwoosh.registerDevice(
                function (status) {
                    var pushToken = status.pushToken;
                    console.log('Push token received:', pushToken);
                    alert('Registered! Token: ' + pushToken);
                },
                function (status) {
                    console.error('Push registration failed:', status);
                    alert('Registration failed: ' + status);
                    switcher.checked = false;
                }
            );
        } else {
            // Unregister from Push Notifications
            pushwoosh.unregisterDevice(
                function (status) {
                    console.log('Unregistered successfully', status);
                    alert('Unregistered from push notifications');
                },
                function (status) {
                    console.error('Unregister failed', status);
                    alert('Unregister failed: ' + status);
                    switcher.checked = true;
                }
            );
        }
    });
}

function pushwooshInitialize(pushwoosh) {
    // Should be called before pushwoosh.onDeviceReady
    document.addEventListener('push-notification', function (event) {
        var notification = event.notification;
        console.log('Received push notification:', JSON.stringify(notification));
        alert('Push received: ' + (notification.message || notification.title || 'No message'));
    });

    // Initialize Pushwoosh
    pushwoosh.onDeviceReady({
        appid: "A8B44-0B460",
        projectid: "245850018966"
    });

    console.log('Pushwoosh initialized');
}
