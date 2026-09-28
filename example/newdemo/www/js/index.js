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

    // Setup all action handlers
    registerForPushNotificationAction(pushwoosh);
    setupNotificationStatusAction(pushwoosh);
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
    presentInboxUIAction(pushwoosh);
    getInboxCountsAction(pushwoosh);
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

// Open the Inbox UI screen
function presentInboxUIAction(pushwoosh) {
    document.getElementById('presentInboxUI').addEventListener('click', function() {
        pushwoosh.presentInboxUI({ dateFormat: "dd.MM.yyyy" });
        console.log('Inbox UI presented');
    });
}

// Show total and unread inbox message counts
function getInboxCountsAction(pushwoosh) {
    document.getElementById('getInboxCounts').addEventListener('click', function() {
        pushwoosh.messagesCount(function(total) {
            pushwoosh.unreadMessagesCount(function(unread) {
                console.log('Inbox counts - total:', total, 'unread:', unread);
                alert('Inbox messages: ' + total + '\nUnread: ' + unread);
            });
        });
    });
}

// Push subscription toggle - reference implementation. isRegisteredForPushNotifications()
// is the source of truth: the checkbox is told the state, never asked for it.
function registerForPushNotificationAction(pushwoosh) {
    var switcher = document.getElementById('switcher');
    var track = document.getElementById('switcherTrack');

    // True while a registerDevice/unregisterDevice call is in flight.
    var pending = false;

    function setToggleEnabled(enabled) {
        switcher.disabled = !enabled;
        if (enabled) {
            track.classList.remove('disabled');
        } else {
            track.classList.add('disabled');
        }
    }

    function syncFromSdk() {
        pushwoosh.isRegisteredForPushNotifications(
            function (registered) {
                // Assigning .checked from code does not fire "change", so this never re-enters
                switcher.checked = registered;
            },
            function (error) {
                console.warn('isRegisteredForPushNotifications failed:', error);
            }
        );
    }

    function onCallDone() {
        pending = false;
        setToggleEnabled(true);
        syncFromSdk();
    }

    switcher.addEventListener('change', function () {
        // Overlapping register/unregister calls race, so lock until the SDK answers
        pending = true;
        setToggleEnabled(false);

        if (switcher.checked) {
            pushwoosh.registerDevice(
                function (status) {
                    console.log('Registered, push token:', status.pushToken);
                    alert('Registered! Token: ' + status.pushToken);
                    onCallDone();
                },
                function (error) {
                    console.error('registerDevice failed:', error);
                    alert('Registration failed: ' + error);
                    onCallDone();
                }
            );
        } else {
            pushwoosh.unregisterDevice(
                function () {
                    console.log('Unregistered from push notifications');
                    alert('Unsubscribed from push notifications');
                    onCallDone();
                },
                function (error) {
                    console.error('unregisterDevice failed:', error);
                    alert('Unregister failed: ' + error);
                    onCallDone();
                }
            );
        }
    });

    // The subscription may have been changed elsewhere while the app was away
    document.addEventListener('resume', function () {
        if (!pending) {
            syncFromSdk();
        }
    }, false);

    syncFromSdk();
}

function pushwooshInitialize(pushwoosh) {
    // Should be called before pushwoosh.onDeviceReady
    document.addEventListener('push-notification', function (event) {
        var notification = event.notification;
        console.log('Received push notification:', JSON.stringify(notification));
    });

    // Fired when a push is received while the app is running (both platforms)
    document.addEventListener('push-receive', function (event) {
        var notification = event.notification;
        console.log('Received push (push-receive):', JSON.stringify(notification));
    });

    // Initialize Pushwoosh
    pushwoosh.onDeviceReady({
        appid: "XXXXX-XXXXX"
    });

    console.log('Pushwoosh initialized');
}
