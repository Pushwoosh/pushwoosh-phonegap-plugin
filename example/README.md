# CORDOVA SAMPLE 

## To launch and utilize a sample with Pushwoosh SDK integration, clone or download the repository archive.

### iOS, Android
 <img src="https://github.com/Pushwoosh/pushwoosh-cordova-sample/blob/main/Screenshots/iOS.png" alt="Alt text" width="300"> <img src="https://github.com/Pushwoosh/pushwoosh-cordova-sample/blob/main/Screenshots/Android.png" alt="Alt text" width="350"> 

### 1. Go to the 'newdemo' folder and install the sample's dependencies:

```
cd newdemo
npm install
```

The Pushwoosh plugin itself is **not** an npm dependency of the sample. It is installed
automatically from the local checkout (`../..`) by the `after_platform_add` hook, so the
sample always builds against the plugin code sitting next to it.

### 2. Add a platform and build:

```
npx cordova platform add android
npx cordova build android
```

```
npx cordova platform add ios
npx cordova build ios
```

### 3. Navigate to the js folder within the www directory and open the file named index.js. Add your App ID

```
/**
* Function: onDeviceReady
* [android, ios, wp8, windows] Initialize Pushwoosh plugin and trigger a start push message
* Should be called on every app launch
* Parameters:
* "config.appid" - Pushwoosh application code
* "config.serviceName" - MPNS service name for wp8 platform
*/

function pushwooshInitialize() {
	 var pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

//Should be called before pushwoosh.onDeviceReady
  // push-receive: fired when a push is received while the app is running
  document.addEventListener('push-receive', function(event) {
      var notification = event.notification;
      // handle received push here
  });

  // push-notification: fired when a push is opened by the user
  document.addEventListener('push-notification', function(event) {
      var notification = event.notification;
      // handle push open here
	 });

 pushwoosh.onDeviceReady({
   appid: "XXXXX-XXXXX",
   serviceName: "XXXX"
 });
}
```

### 4. [Android] Add the 'google-services.json' file to the app folder in Android 

### 5. [Android] Add the following section to your config.xml:

```
<platform name="android">
   <resource-file src="google-services.json" target="app/google-services.json" />
   ...
</platform>

```

### 6. [iOS] Notification Service Extension, App Group and badges

Nothing to do by hand in Xcode for the simulator. `hooks/ios-nse.js` runs after every
`cordova prepare ios` and `cordova build ios` and wires the extension into the generated project:

- adds the `NotificationService` target (`<app id>.NotificationService`, same deployment target as
  the app) built from `ios-nse/NotificationService/NotificationService.swift`, a subclass of
  `PushwooshNotificationServiceExtension`;
- appends the `NotificationService` block with the `PushwooshXCFramework` pod to
  `platforms/ios/Podfile` and runs `pod install` (cordova-ios rewrites the Podfile on every
  prepare, so the hook puts the block back each time);
- shares the App Group `group.<app id>` between the app and the extension. The group is the
  `PW_APP_GROUP` build setting; both entitlements files and both `Info.plist` files
  (`PW_APP_GROUPS_NAME`) reference it as `$(PW_APP_GROUP)`, and `config.xml` declares the app side.

The App Group is how the extension learns the application code passed to `pushwooshInitialize` in
`www/js/index.js`: without it the extension skips the delivery event. The extension is what sends
delivery statistics, keeps the badge in sync and downloads the image of a notification. Repeated
builds and `cordova platform rm ios && cordova platform add ios` keep one target and one Podfile
block.

Running on a real device is the one case that still needs Xcode by hand: open the generated
project and set your signing team on both the app target and the new `NotificationService`
target, the same way you would for any extension.

### 7. [Android] Huawei (HMS)

Huawei delivery works out of the box: `agconnect-services.json` ships with the sample and the
`hooks/hms-android.js` hook adds the Huawei Maven repository, the `com.huawei.agconnect:agcp`
classpath and the `com.huawei.hms:push` dependency to the generated Android project on every
prepare. Nothing to enable in JavaScript — the native SDK picks HMS automatically on a Huawei
device.

One thing you must do yourself: register the **SHA-256 fingerprint of the signing certificate
you build with** in AppGallery Connect (Project settings → General information → SHA-256
certificate fingerprint). Without it, registration fails on the device with
`6003: certificate fingerprint error`.

Expected log on a Huawei device: `PUSH TRANSPORT SET/CHANGED: Huawei (device type 17)`.
On a Google-services device you get `Android FCM (device type 3)` instead.

## The guide for SDK integration is available on the Pushwoosh [website](https://docs.pushwoosh.com/platform-docs/pushwoosh-sdk/cross-platform-frameworks/cordova/integrating-cordova-plugin)

Documentation:
https://github.com/Pushwoosh/pushwoosh-ios-sdk/tree/master/Documentation

Pushwoosh team
http://www.pushwoosh.com

