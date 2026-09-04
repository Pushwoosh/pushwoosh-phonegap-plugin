# CORDOVA VOIP SAMPLE

## VoIP Demo application showcasing Pushwoosh SDK VoIP functionality with CallKit integration

### iOS, Android

## Quick Start

### 1. Add platforms

Simply add the required platforms — all dependencies will be installed automatically:

```bash
cd demovoip
npm install

# Add iOS platform
cordova platform add ios

# Add Android platform
cordova platform add android
```

**What happens automatically:**
- `pushwoosh-cordova-plugin` is installed from the local checkout (`../..`) by the
  `after_platform_add` hook, with both `PW_VOIP_IOS_ENABLED` and
  `PW_VOIP_ANDROID_ENABLED` forwarded on every install — cordova overwrites the saved
  variables per platform instead of merging them, so forwarding only the platform you
  added would disable VoIP on the other one
- `second-webview-plugin`, the multi-WebView reproducer, is installed alongside it
- `google-services.json` is copied into the Android project by the `<resource-file>`
  entry in `config.xml`
- the Gradle and AGP versions come from the preferences in `config.xml`

The Pushwoosh plugin is **not** an npm dependency of the sample. It lives two directories
up, and a `file:` dependency pointing at its own grandparent cannot be resolved by
cordova-fetch. The hook installs it with `--link --nosave`, so `package.json` stays free
of plugin entries and the next clean checkout builds exactly the same way.

### 2. Configure your VoIP App Code

Open the app and set your VoIP App Code in the UI, or modify the default value in `www/index.html`:

```html
<input type="text" id="pushAppId" value="YOUR-APP-ID">
```

### 3. [Android] Configure Firebase

Place your `google-services.json` in the project root. The file will be automatically copied to `platforms/android/app/` when running `cordova prepare`.

To work with Firebase/FCM:
1. Download `google-services.json` from Firebase Console
2. Place it in `/demovoip/google-services.json`
3. Run `cordova prepare android`

### 4. [iOS] VoIP Push Notifications Setup

#### a. Enable VoIP Push in your Apple Developer Account
- Navigate to your App ID settings
- Enable "Background Modes" → "Voice over IP"
- Enable "Push Notifications"

#### b. Configure CallKit in Xcode
Open the Xcode project (`platforms/ios/demovoip.xcworkspace`) and ensure:
- Background Modes → Voice over IP is enabled
- Push Notifications capability is added

### 5. Build and Run

```bash
# iOS
cordova build ios

# Android
cordova build android
```

## Features

- VoIP push notifications support
- CallKit integration (iOS)
- Android calling support with permissions
- Real-time VoIP event monitoring
- Interactive demo UI with event logging
- Manual SDK initialization with App ID input
- VoIP parameters configuration (video, ringtone, handle type)

## Project layout

```
demovoip/
├── www/                     # application sources (index.html, js/index.js, css/index.css)
├── hooks/
│   ├── install-plugin.js    # after_platform_add: installs the plugin and the reproducer
│   └── __tests__/           # unit suite for the hook
├── second-webview-plugin/   # local plugin, opens a second WebView to reproduce the VoIP bug
├── google-services.json     # Firebase configuration for Android
├── config.xml               # cordova configuration, incl. the toolchain preferences
└── package.json             # platform pins only, no plugin declarations
```

## Hook tests

```bash
cd demovoip
npm test
```

From the repository root, `make test-samples` runs the hook suites of every example app.

## App Features

### Push Notifications Setup
- Initialize Pushwoosh SDK with App ID
- Automatically set VoIP App Code

### VoIP Parameters
- Enable/disable video support
- Configure ringtone sound (iOS only)
- Select handle type (Generic, Phone Number, Email)

### Call Permissions (Android)
- Request call permission (Android 12+)
- Check permission status

### Push Notifications (Android)
- Register for regular push notifications
- Get push token

### Call Controls
- End active VoIP call

### VoIP Events Log
- Monitor all VoIP events:
  - `voipPushPayload` - VoIP notification received
  - `answer` - Incoming call answered
  - `reject` - Incoming call rejected
  - `hangup` - Call ended
  - `muted` / `unmuted` - Microphone muted/unmuted
  - `held` / `unheld` - Call held/unheld
  - `dtmf` - DTMF tones
  - `audioInterruption` - Audio interruption
  - `callFailed` - Call failed
  - `providerDidActivate` / `providerDidDeactivate` - CallKit activation/deactivation
  - `incomingCallSuccess` / `incomingCallFailure` - Incoming call success/failure
  - `voipDidRegisterTokenSuccessfully` / `voipDidFailToRegisterTokenWithError` - VoIP token registration

## Testing VoIP Calls

### iOS
1. Build and run the app on a physical device (VoIP doesn't work on simulator)
2. The app will automatically register for VoIP notifications
3. Send a VoIP push from Pushwoosh Control Panel using the VoIP App Code
4. Receive an incoming call via CallKit

### Android
1. Build and run the app
2. Grant call permission (Android 12+)
3. Tap "Register for Push Notifications" to register
4. Send a VoIP push from Pushwoosh Control Panel
5. Receive an incoming call via Android Calling API

## Troubleshooting

### Android: "Minimum supported Gradle version" or "Incompatible AGP version"
The Gradle and Android Gradle Plugin versions come from the `GradleVersion` and
`AndroidGradlePluginVersion` preferences in `config.xml`, which is the only place they
are declared. Change them there and re-create the platform:
```bash
cordova platform rm android
cordova platform add android
```

### `platform add` failed and re-running says "Platform already added"
The install hook throws after `platforms/<platform>` is already on disk, so a plain
retry hits a half-ready platform. Remove it first:
```bash
cordova platform rm android
cordova platform add android
```

### Android: Firebase FIS_AUTH_ERROR
Make sure that:
1. `google-services.json` is in the project root
2. An Android app with package name `com.example.sampleapp` is added in Firebase Console
3. A client for package `com.example.sampleapp` is present in `client[]` of `google-services.json` (`oauth_client` is not required)

### iOS: VoIP events not firing
Make sure that:
1. `registerVoIPEvents()` is called immediately in `onDeviceReady()`, BEFORE SDK initialization
2. The app is running on a physical device (not simulator)
