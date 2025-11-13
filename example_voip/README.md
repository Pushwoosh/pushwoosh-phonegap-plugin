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
- `pushwoosh-cordova-plugin` is installed with VoIP enabled for the added platform
  - iOS: `PW_VOIP_IOS_ENABLED=true` is set automatically
  - Android: `PW_VOIP_ANDROID_ENABLED=true` is set in gradle.properties
- Gradle 8.9 and AGP 8.5.1 are configured for Android
- `google-services.json` is copied for Firebase/FCM

### 2. Configure your VoIP App Code

Open the app and set your VoIP App Code in the UI, or modify the default value in `www/index.html`:

```html
<input type="text" id="pushAppId" value="YOUR-APP-ID">
<input type="text" id="pushProjectId" value="YOUR-FCM-PROJECT-ID">
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

## App Features

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
