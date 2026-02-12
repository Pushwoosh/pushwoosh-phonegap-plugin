<h1 align="center">Pushwoosh Cordova Plugin</h1>

<p align="center">
  <a href="https://github.com/Pushwoosh/pushwoosh-phonegap-plugin/releases"><img src="https://img.shields.io/github/release/Pushwoosh/pushwoosh-phonegap-plugin.svg?style=flat-square" alt="GitHub release"></a>
  <a href="https://www.npmjs.com/package/pushwoosh-cordova-plugin"><img src="https://img.shields.io/npm/v/pushwoosh-cordova-plugin.svg?style=flat-square" alt="npm"></a>
  <a href="https://www.npmjs.com/package/pushwoosh-cordova-plugin"><img src="https://img.shields.io/npm/l/pushwoosh-cordova-plugin.svg?style=flat-square" alt="license"></a>
</p>

<p align="center">
  Cross-platform push notifications, In-App messaging, and more for Cordova / PhoneGap applications.
</p>

## Table of Contents

- [Documentation](#documentation)
- [Features](#features)
- [Installation](#installation)
- [AI-Assisted Integration](#ai-assisted-integration)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Plugin Preferences](#plugin-preferences)
- [Support](#support)
- [License](#license)

## Documentation

- [Integration Guide](https://docs.pushwoosh.com/platform-docs/pushwoosh-sdk/cross-platform-frameworks/cordova/integrating-cordova-plugin) — step-by-step setup
- [API Reference](https://docs.pushwoosh.com/platform-docs/pushwoosh-sdk/cross-platform-frameworks/cordova/cordova-plugin-api-reference) — full API documentation

## Features

- **Push Notifications** — register, receive, and handle push notifications on iOS and Android
- **In-App Messages** — trigger and display in-app messages based on events
- **Tags & Segmentation** — set and get user tags for targeted messaging
- **User Identification** — associate devices with user IDs for cross-device tracking
- **Message Inbox** — built-in UI for message inbox with customization options
- **Badge Management** — set, get, and increment app icon badge numbers
- **Local Notifications** — schedule and manage local notifications
- **VoIP Calls** — CallKit (iOS) and ConnectionService (Android) integration for VoIP push calls
- **Huawei Push** — HMS push notification support
- **TypeScript Support** — full TypeScript definitions included

## Installation

Using npm:

```bash
cordova plugin add pushwoosh-cordova-plugin@8.3.62
```

Using git:

```bash
cordova plugin add https://github.com/Pushwoosh/pushwoosh-phonegap-plugin.git#8.3.62
```

## AI-Assisted Integration

Integrate the Pushwoosh Cordova plugin using AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.).

> **Requirement:** Your AI assistant must have access to [Context7](https://context7.com/) MCP server or web search capabilities.

### Quick Start Prompts

Choose the prompt that matches your task:

---

#### 1. Basic Plugin Integration

```
Integrate Pushwoosh Cordova plugin into my Cordova project.

Requirements:
- Install pushwoosh-cordova-plugin via npm
- Initialize Pushwoosh with my App ID in deviceready event
- Register for push notifications and handle push-receive and push-notification events

Use Context7 MCP to fetch Pushwoosh Cordova plugin documentation.
```

---

#### 2. Tags and User Segmentation

```
Show me how to use Pushwoosh tags in a Cordova app for user segmentation.
I need to set tags, get tags, and set user ID for cross-device tracking.

Use Context7 MCP to fetch Pushwoosh Cordova plugin documentation for setTags and getTags.
```

---

#### 3. Message Inbox Integration

```
Integrate Pushwoosh Message Inbox into my Cordova app. Show me how to:
- Display the inbox UI with custom styling
- Load messages programmatically
- Track unread message count

Use Context7 MCP to fetch Pushwoosh Cordova plugin documentation for presentInboxUI.
```

---

## Quick Start

### 1. Initialize the Plugin

```javascript
document.addEventListener('deviceready', function() {
    var pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

    pushwoosh.onDeviceReady({
        appid: "YOUR_PUSHWOOSH_APP_ID",
        projectid: "YOUR_FCM_SENDER_ID",
        serviceName: "YOUR_SERVICE_NAME"
    });

    pushwoosh.registerDevice(
        function(status) {
            console.log("Registered with push token: " + status.pushToken);
        },
        function(error) {
            console.error("Failed to register: " + error);
        }
    );
}, false);
```

### 2. Handle Push Notifications

```javascript
// Notification received while app is in foreground
document.addEventListener('push-receive', function(event) {
    var notification = event.notification;
    console.log("Push received: " + JSON.stringify(notification));
});

// Notification opened by user
document.addEventListener('push-notification', function(event) {
    var notification = event.notification;
    console.log("Push opened: " + JSON.stringify(notification));
});
```

### 3. Set User Tags

```javascript
var pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

pushwoosh.setTags(
    { username: "john_doe", age: 25, interests: ["sports", "tech"] },
    function() { console.log("Tags set successfully"); },
    function(error) { console.error("Failed to set tags: " + error); }
);
```

### 4. Post Events for In-App Messages

```javascript
var pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

pushwoosh.setUserId("user_12345");
pushwoosh.postEvent("purchase_complete", {
    productName: "Premium Plan",
    amount: "9.99"
});
```

## API Reference

### Initialization & Registration

| Method | Description |
|--------|-------------|
| `onDeviceReady(config)` | Initialize the plugin. Call on every app launch |
| `registerDevice(success, fail)` | Register for push notifications |
| `unregisterDevice(success, fail)` | Unregister from push notifications |
| `getPushToken(success)` | Get the push token |
| `getPushwooshHWID(success)` | Get Pushwoosh Hardware ID |

### Tags & User Data

| Method | Description |
|--------|-------------|
| `setTags(tags, success, fail)` | Set device tags |
| `getTags(success, fail)` | Get device tags |
| `setUserId(userId)` | Set user identifier for cross-device tracking |
| `setLanguage(language)` | Set custom language for localized pushes |
| `setEmail(email, success, fail)` | Register email for the user |
| `setEmails(emails, success, fail)` | Register multiple emails |

### Notifications

| Method | Description |
|--------|-------------|
| `getRemoteNotificationStatus(success, fail)` | Get push notification permission status |
| `getLaunchNotification(success)` | Get notification that launched the app |
| `createLocalNotification(config, success, fail)` | Schedule a local notification |
| `clearLocalNotification()` | Clear all pending local notifications (Android) |
| `clearNotificationCenter()` | Clear all notifications from notification center (Android) |

### Badge Management

| Method | Description |
|--------|-------------|
| `setApplicationIconBadgeNumber(badge)` | Set badge number |
| `getApplicationIconBadgeNumber(success)` | Get current badge number |
| `addToApplicationIconBadgeNumber(badge)` | Increment/decrement badge |

### In-App Messages & Events

| Method | Description |
|--------|-------------|
| `postEvent(event, attributes)` | Post event to trigger In-App Messages |
| `addJavaScriptInterface(name)` | Add JS interface for Rich Media communication |

### Message Inbox

| Method | Description |
|--------|-------------|
| `presentInboxUI(params)` | Open inbox UI with optional style customization |
| `loadMessages(success, fail)` | Load inbox messages programmatically |
| `unreadMessagesCount(success)` | Get unread message count |
| `messagesCount(success)` | Get total message count |
| `readMessage(id)` | Mark message as read |
| `deleteMessage(id)` | Delete a message |
| `performAction(id)` | Perform the action associated with a message |

### Communication Control

| Method | Description |
|--------|-------------|
| `setCommunicationEnabled(enable, success, fail)` | Enable/disable all Pushwoosh communication |
| `isCommunicationEnabled(success)` | Check if communication is enabled |

### Events

| Event | Description |
|-------|-------------|
| `push-receive` | Fired when a notification is received while the app is active |
| `push-notification` | Fired when a notification is opened by the user |

## Plugin Preferences

Configure these in your `config.xml`:

```xml
<plugin name="pushwoosh-cordova-plugin">
    <variable name="LOG_LEVEL" value="DEBUG" />
    <variable name="IOS_FOREGROUND_ALERT_TYPE" value="ALERT" />
    <variable name="ANDROID_FOREGROUND_PUSH" value="true" />
    <variable name="PW_VOIP_IOS_ENABLED" value="false" />
    <variable name="PW_VOIP_ANDROID_ENABLED" value="false" />
</plugin>
```

| Preference | Default | Description |
|-----------|---------|-------------|
| `LOG_LEVEL` | `DEBUG` | Logging level |
| `IOS_FOREGROUND_ALERT_TYPE` | `ALERT` | iOS foreground notification display type |
| `ANDROID_FOREGROUND_PUSH` | `true` | Show notifications when app is in foreground (Android) |
| `PW_VOIP_IOS_ENABLED` | `false` | Enable VoIP calling features on iOS |
| `PW_VOIP_ANDROID_ENABLED` | `false` | Enable VoIP calling features on Android |

## Support

- [Documentation](https://docs.pushwoosh.com/)
- [Support Portal](https://support.pushwoosh.com/)
- [Report Issues](https://github.com/Pushwoosh/pushwoosh-phonegap-plugin/issues)

## License

Pushwoosh Cordova Plugin is available under the MIT license. See [LICENSE](LICENSE.md) for details.

---

Made with ❤️ by [Pushwoosh](https://www.pushwoosh.com/)
