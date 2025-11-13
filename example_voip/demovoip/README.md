# Pushwoosh VoIP Demo App

Demo application for testing Pushwoosh SDK VoIP functionality in Cordova.

## Quick Start

### 1. Adding Platforms

Simply add the required platforms — all dependencies will be installed automatically:

```bash
# Add iOS platform
cordova platform add ios

# Add Android platform
cordova platform add android
```

**What happens automatically:**
- `pushwoosh-cordova-plugin` is installed with VoIP enabled for the added platform
  - iOS: `PW_VOIP_IOS_ENABLED=true` is set automatically
  - Android: `PW_VOIP_ANDROID_ENABLED=true` is set in gradle.properties
- Gradle 8.9 and AGP 8.5.1 are configured for Android
- `google-services.json` is copied for Firebase/FCM

### 2. Configuration

#### App ID and VoIP App Code
By default, the test App ID is used: `7BCDB-76CBE`

To use your own App ID, change the values in `www/index.html`:
```html
<input type="text" id="pushAppId" value="YOUR-APP-ID">
<input type="text" id="pushProjectId" value="YOUR-FCM-PROJECT-ID">
```

#### Google Services (Android)
To work with Firebase/FCM, place your `google-services.json` in the project root. The file will be automatically copied to `platforms/android/app/` when running `cordova prepare`.

### 3. Build

```bash
# iOS
cordova build ios

# Android
cordova build android
```

## Project Structure

```
demovoip/
├── www/                        # Application sources
│   ├── index.html             # Main page with UI
│   ├── js/index.js            # Application logic
│   └── css/index.css          # Styles
├── hooks/                      # Cordova hooks (automation)
│   ├── after_prepare/         # Run after cordova prepare
│   │   ├── 010_setup_gradle_wrapper.js    # Sets up Gradle 8.9
│   │   ├── 015_fix_agp_version.js         # Fixes AGP to 8.5.1
│   │   └── 020_copy_google_services.js    # Copies google-services.json
│   └── after_platform_add/    # Run after platform add
│       └── 010_install_plugin.js          # Installs Pushwoosh plugin
├── google-services.json       # Firebase configuration for Android
├── config.xml                 # Cordova configuration
└── package.json               # npm dependencies

```

## Application Features

### Push Notifications Setup
- Initialize Pushwoosh SDK with App ID and FCM Project ID
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

## Configuration (config.xml)

### Android Settings
```xml
<platform name="android">
    <preference name="GradleVersion" value="8.9" />
    <preference name="AndroidGradlePluginVersion" value="8.5.1" />
    <preference name="android-minSdkVersion" value="24" />
    <preference name="android-targetSdkVersion" value="35" />
</platform>
```

### Hooks
```xml
<hook type="after_prepare" src="hooks/after_prepare/010_setup_gradle_wrapper.js" />
<hook type="after_prepare" src="hooks/after_prepare/015_fix_agp_version.js" />
<hook type="after_prepare" src="hooks/after_prepare/020_copy_google_services.js" />
<hook type="after_platform_add" src="hooks/after_platform_add/010_install_plugin.js" />
```

## Testing VoIP

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

## Requirements

- Node.js 14+
- Cordova CLI 12+
- For iOS: Xcode 14+, macOS
- For Android: Android Studio, JDK 17, Android SDK

## Versions

- Cordova Android: 14.0.1
- Cordova iOS: 7.1.1
- Pushwoosh Cordova Plugin: 8.3.49
- Gradle: 8.9
- Android Gradle Plugin: 8.5.1

## Troubleshooting

### Android: "Minimum supported Gradle version is 8.9"
The hook automatically creates `gradle-wrapper.properties` with Gradle 8.9. If the error appears, run:
```bash
cordova prepare android
```

### Android: "Incompatible AGP version"
The hook automatically fixes AGP to 8.5.1. If the error appears, run:
```bash
cordova prepare android
```

### Android: Firebase FIS_AUTH_ERROR
Make sure that:
1. `google-services.json` is in the project root
2. An Android app with package name `com.pushwoosh.demovoip` is added in Firebase Console
3. `oauth_client` arrays are populated in `google-services.json`

### iOS: VoIP events not firing
Make sure that:
1. `registerVoIPEvents()` is called immediately in `onDeviceReady()`, BEFORE SDK initialization
2. The app is running on a physical device (not simulator)
3. VoIP App Code is set via `setVoipAppCode()`
