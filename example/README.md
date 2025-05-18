# CORDOVA SAMPLE 

## To launch and utilize a sample with Pushwoosh SDK integration, clone or download the repository archive.

### iOS, Android
 <img src="https://github.com/Pushwoosh/pushwoosh-cordova-sample/blob/main/Screenshots/iOS.png" alt="Alt text" width="300"> <img src="https://github.com/Pushwoosh/pushwoosh-cordova-sample/blob/main/Screenshots/Android.png" alt="Alt text" width="350"> 

### 1. Go to 'newdemo' folder and install the package from the command line:

```
cordova plugin add pushwoosh-cordova-plugin
```

### 2. Navigate to the js folder within the www directory and open the file named index.js. Add your App ID and FCM Sender ID

```
/**
* Function: onDeviceReady
* [android, ios, wp8, windows] Initialize Pushwoosh plugin and trigger a start push message
* Should be called on every app launch
* Parameters:
* "config.appid" - Pushwoosh application code
* "config.projectid" - GCM project number for android platform
* "config.serviceName" - MPNS service name for wp8 platform
*/

function initPushwoosh() {
	 var pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

//Should be called before pushwoosh.onDeviceReady
  document.addEventListener('push-notification', function(event) {
      var notification = event.notification;
      // handle push open here
	 });

 pushwoosh.onDeviceReady({        
   appid: "XXXXX-XXXXX",
   projectid: "XXXXXXXXXXXXXXX",
   serviceName: "XXXX"
 });
}
```

### 3. [Android] Add the 'google-services.json' file to the app folder in Android 

### 4. [Android] Add the following section to your config.xml:

```
<platform name="android">
   <resource-file src="google-services.json" target="app/google-services.json" />
   ...
</platform>

```

### 5. [iOS] Badges

### a. Open the Xcode project, navigate to the TARGETS tab, and add your App Group name in the App Group section for both targets (newdemo and NotificationService).

<img src="https://github.com/Pushwoosh/pushwoosh-cordova-sample/blob/main/Screenshots/xcode_1.png" alt="Alt text" width="500">

### b. Add the App Groups ID to your info.plist for each target of your application:

```
<key>PW_APP_GROUPS_NAME</key>
<string>group.com.example.demo</string>

```

## The guide for SDK integration is available on the Pushwoosh [website](https://docs.pushwoosh.com/platform-docs/pushwoosh-sdk/cross-platform-frameworks/cordova/integrating-cordova-plugin)

Documentation:
https://github.com/Pushwoosh/pushwoosh-ios-sdk/tree/master/Documentation

Pushwoosh team
http://www.pushwoosh.com

