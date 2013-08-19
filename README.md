Cordova Pushwoosh Push Notifications plugin
===================================================

cross-platform PushWoosh for Cordova / PhoneGap

follows the Cordova Plugin spec https://github.com/alunny/cordova-plugin-spec

so that it works with Pluginstall https://github.com/alunny/pluginstall

## LICENSE

	The MIT License
	
	Copyright (c) 2012 Adobe Systems, inc.
	portions Copyright (c) 2012 Olivier Louvignes
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

## Manual Installation for Android

	Set up the following permissions in the AndroidManifest.xml
			<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
			
			<!--library-->
			<uses-permission android:name="android.permission.READ_PHONE_STATE"/>
			
			<!-- GCM connects to Google Services. -->
			<uses-permission android:name="android.permission.INTERNET"/>
			
			<!-- GCM requires a Google account. -->
			<uses-permission android:name="android.permission.GET_ACCOUNTS"/>
			
			<!-- Keeps the processor from sleeping when a message is received. -->
			<uses-permission android:name="android.permission.WAKE_LOCK"/>
			
			<!--
			 Creates a custom permission so only this app can receive its messages.
			 
			 NOTE: the permission *must* be called PACKAGE.permission.C2D_MESSAGE,
			 where PACKAGE is the application's package name.
			 -->
			<permission
			android:name="$PACKAGE_NAME.permission.C2D_MESSAGE"
			android:protectionLevel="signature"/>
			<uses-permission
			android:name="$PACKAGE_NAME.permission.C2D_MESSAGE"/>
			
			<!-- This app has permission to register and receive data message. -->
			<uses-permission
			android:name="com.google.android.c2dm.permission.RECEIVE"/>

			<intent-filter>
				<action android:name="$PACKAGE_NAME.MESSAGE"/>
				<category android:name="android.intent.category.DEFAULT"/>
			</intent-filter>

			<activity android:name="com.arellomobile.android.push.PushWebview"/>
			
			<activity android:name="com.arellomobile.android.push.MessageActivity"/>
			
			<activity android:name="com.arellomobile.android.push.PushHandlerActivity"/>
			
			<!--
			 BroadcastReceiver that will receive intents from GCM
			 services and handle them to the custom IntentService.
			 
			 The com.google.android.c2dm.permission.SEND permission is necessary
			 so only GCM services can send data messages for the app.
			 -->
			<receiver
				android:name="com.google.android.gcm.GCMBroadcastReceiver"
				android:permission="com.google.android.c2dm.permission.SEND">
				<intent-filter>
					<!-- Receives the actual messages. -->
					<action android:name="com.google.android.c2dm.intent.RECEIVE"/>
					<!-- Receives the registration id. -->
					<action android:name="com.google.android.c2dm.intent.REGISTRATION"/>
					<category android:name="$PACKAGE_NAME"/>
				</intent-filter>
			</receiver>
			
			<!--
			 Application-specific subclass of PushGCMIntentService that will
			 handle received messages.
			 -->
			<service android:name="com.arellomobile.android.push.PushGCMIntentService"/>
			
	        <!--
	          Service for sending location updates
	        -->
	        <service android:name="com.arellomobile.android.push.GeoLocationService"/>
        
	        <receiver android:name="com.arellomobile.android.push.AlarmReceiver"></receiver>
			
	Add the following entries to the config.xml file:
		
            <plugin name="PushNotification"
			value="com.pushwoosh.plugin.pushnotifications.PushNotifications" onload="true"/>

            <access origin="https://cp.pushwoosh.com" subdomains="true" />

    Copy the following files into your plugin folder for the project:

		com/pushwoosh/plugin/pushnotifications/PushNotifications.java
		com/google/android/gcm/GCMBaseIntentService.java
		com/google/android/gcm/GCMBroadcastReceiver.java
		com/google/android/gcm/GCMConstants.java
		com/google/android/gcm/GCMRegistrar.java
		com/arellomobile/android/push/AlarmReceiver.java
		com/arellomobile/android/push/BasePushMessageReceiver.java
		com/arellomobile/android/push/DeviceFeature2_5.java
		com/arellomobile/android/push/DeviceRegistrar.java
		com/arellomobile/android/push/GeoLocationService.java
		com/arellomobile/android/push/MessageActivity.java
		com/arellomobile/android/push/PushEventsTransmitter.java
		com/arellomobile/android/push/PushGCMIntentService.java
		com/arellomobile/android/push/PushHandlerActivity.java
		com/arellomobile/android/push/PushManager.java
		com/arellomobile/android/push/PushWebview.java
		com/arellomobile/android/push/data/PushZoneLocation.java
		com/arellomobile/android/push/exception/PushWooshException.java
		com/arellomobile/android/push/preference/SoundType.java
		com/arellomobile/android/push/preference/VibrateType.java
		com/arellomobile/android/push/request/RequestHelper.java
		com/arellomobile/android/push/tags/SendPushTagsAbstractAsyncTask.java
		com/arellomobile/android/push/tags/SendPushTagsAsyncTask.java
		com/arellomobile/android/push/tags/SendPushTagsCallBack.java
		com/arellomobile/android/push/utils/executor/ExecutorHelper.java
		com/arellomobile/android/push/utils/GeneralUtils.java
		com/arellomobile/android/push/utils/NetworkUtils.java
		com/arellomobile/android/push/utils/PreferenceUtils.java
		com/arellomobile/android/push/utils/executor/V11ExecutorHelper.java
		com/arellomobile/android/push/utils/WorkerTask.java
		com/arellomobile/android/push/utils/notification/BannerNotificationFactory.java
		com/arellomobile/android/push/utils/notification/BaseNotificationFactory.java
		com/arellomobile/android/push/utils/notification/Helper.java
		com/arellomobile/android/push/utils/notification/NotificationCreator.java
		com/arellomobile/android/push/utils/notification/NotificationFactory.java
		com/arellomobile/android/push/utils/notification/SimpleNotificationFactory.java
		com/arellomobile/android/push/utils/notification/V11NotificationCreator.java

 
## Manual Installation for iOS

Copy the following files to your project's Plugins folder:

	HtmlWebViewController.h 
	HtmlWebViewController.m 
	PWGetNearestZoneRequest.h 
	PWGetNearestZoneRequest.m 
	PWPushStatRequest.h 
	PWPushStatRequest.m 
	PWRegisterDeviceRequest.h 
	PWRegisterDeviceRequest.m 
	PWRequest.h 
	PWRequest.m 
	PWRequestManager.h 
	PWRequestManager.m 
	PWSendBadgeRequest.h 
	PWSendBadgeRequest.m 
	PWGetTagsRequest.h 
	PWGetTagsRequest.m 
	PWSetTagsRequest.h 
	PWSetTagsRequest.m 
	PushNotificationManager.h 
	PushNotificationManager.m

Add a reference for this plugin to the plugins dictionary in **Cordova.plist**:

	<key>PushNotification</key>
	<string>PushNotification</string>

Add the **PushNotification.js** script to your assets/www folder (or within a javascripts folder within your www folder) and reference it in your main index.html file.

    <script type="text/javascript" charset="utf-8" src="PushNotification.js"></script>

## Automatic Installation
This plugin is based on [pluginstall](https://github.com/alunny/pluginstall). to install it to your app,
simply execute pluginstall as follows;

	pluginstall [PLATFORM] [TARGET-PATH] [PLUGIN-PATH]
	
	where
		[PLATFORM] = ios or android
		[TARGET-PATH] = path to folder containing your phonegap project
		[PLUGIN-PATH] = path to folder containing this plugin

For additional info, take a look at the [Cordova Pluginstall Specification](https://github.com/alunny/cordova-plugin-spec)


## Plugin API
In the Examples folder you will find a sample implementation showing how to interact with the PushPlugin. Modify it to suit your needs.

First create the plugin instance variable.

	var pushNotification;
	
When deviceReady fires, get the plugin reference

	pushNotification = window.plugins.pushNotification;


#### register
This should be called as soon as the device becomes ready. On success, you will get a call to tokenHandler (iOS), or  onNotificationGCM (Android), allowing you to obtain the device token or registration ID, respectively. Those values will typically get posted to your intermediary push server so it knows who it can send notifications to.

	if (device.platform == 'android' || device.platform == 'Android') {
        pushNotification.registerDevice({ alert:true, badge:true, sound:true,  projectid: "...your GCM project number...", appid : "CDAPP-00000" },
                                        function(status) {
                                            var pushToken = status;
                                            showStatusMsg('push token: ' + JSON.stringify(pushToken));
                                        },
                                        function(status) {
                                            showStatusMsg(JSON.stringify(['failed to register', status]));
                                        });


	} else {
        pushNotification.registerDevice({ alert:true, badge:true, sound:true,  appname: "...your app name...", pw_appid : "CDAPP-00000" },
                                        function(status) {
                                            var pushToken = status;
                                            showStatusMsg('push token: ' + JSON.stringify(pushToken));
                                        },
                                        function(status) {
                                            showStatusMsg(JSON.stringify(['failed to register', status]));
                                        });

	}
	
**ecb** - event callback that gets called when your device receives a notification

   document.addEventListener('push-notification', function(event) {
                              var notification = event.notification;
                              pushNotification.setApplicationIconBadgeNumber(0);
                              var title = notification.title;
                              var userData = notification.userdata;
                              navigator.notification.alert(notification.aps.alert);
                              
                              if(typeof(userData) != "undefined") {
                              showStatusMsg('user data: ' + JSON.stringify(userData));
                              }
                              });
    

## Test Environment
The notification system consists of several interdependent components.

	1) The client application which runs on a device and receives notifications.
	2) The notification service provider (APNS for Apple, GCM for Google)
	3) Intermediary servers that collect device IDs from clients and push notifications through APNS and/or GCM. (PushWoosh.com)
	
This plugin and its target Cordova application comprise the client application which will communicate with PushWoosh which, in turn, communicates with APNS and GCM.

**Prerequisites**.

- Ruby gems is installed and working.

- You have successfully built a client with this plugin, on both iOS and Android and have installed them on a device.


#### 1) Register for a PushWoosh account.
	
	a) Set up profile for your app with the Pushwoosh admin interface
	
#### 2) (iOS) [Follow this tutorial](http://www.raywenderlich.com/3443/apple-push-notification-services-tutorial-part-12) to create a file called ck.pem.
Start at the section entitled "Generating the Certificate Signing Request (CSR)", and substitute your own Bundle Identifier, and Description.
	
	a) go the this plugin's Example folder and open pushAPNS.rb in the text editor of your choice.
	b) set the APNS.pem variable to the path of the ck.pem file you just created
	c) set APNS.pass to the password associated with the certificate you just created. (warning this is cleartext, so don't share this file)
	d) set device_token to the token for the device you want to send a push to. (you can run the Cordova app / plugin in Xcode and extract the token from the log messages)
	e) save your changes.
	
#### 3) (Android) [Follow these steps](http://developer.android.com/guide/google/gcm/gs.html) to generate a project ID and a server based API key.

	a) go the this plugin's Example folder and open pushGCM.rb in the text editor of your choice.
	b) set the GCM.key variable to the API key you just generated.
	c) set the destination variable to the Registration ID of the device. (you can run the Cordova app / plugin in on a device via Eclipse and extract the regID from the log messages)
	
#### 4) Push a notification

	a) Go to the Push form for your app within the Pushwoosh admin interface.
	b) Enter message and press click "Woosh!"

If all went well, you should see a notification show up on each device. If not, make sure you are not being blocked by a firewall, and that you have internet access. Check and recheck the token id, the registration ID and the certificate generating process.

In a production environment, your app, upon registration, would send the device id (iOS) or the registration id (Android), to your intermediary push server. For iOS, the push certificate would also be stored there, and would be used to authenticate push requests to the APNS server. When a push request is processed, this information is then used to target specific apps running on individual devices.


## Notes
	Pushwoosh generates its own App ID which looks something like CD1AA-12345 (not to be confused with Apple's App ID) 

	Within the JS source code of your app you will need to change the name of the parameter depending on whether you're connecting from an iOS device or an Android device.

	In iOS the App ID parameter is named "pw_appid"
	In Android the App ID parameter is named "appid"

	The actual value of the App ID can be found in the Pushwoosh Admin interface for each app you have set up (They call it "Application Code" in there)

	This means you need a bit of custom JS within your app that detects the OS and executes the correct RegisterDevice() call with the correct parameter names and values depending on what sort of device the app is running on.




	For iOS you will need a Distribution Certificate in order to access the APN Production Gateway (which PGB uses).
	Your APNS profile should look something like this:
		Gateway: Production
		Name: MyApp
		Type: Distribution
		App ID: MyApp (org.example.com.MyApp)
		Certificate: 1
		Devices: 1
		Enabled Services: Push Notifications, etc.
		Expire: May 07, 2014
		Status: Active

	Your Google GCM profiles should look something like this:
		Name: MyProject
		Project Number: 123456789012 
		Project ID: MyApp
		Owners: me@gmail.com

	The App ID from the APNS profile above should be the same package id specified in the www/config.xml file's widget/@id attribute ...
		<widget xmlns = "http://www.w3.org/ns/widgets"
			xmlns:gap = "http://phonegap.com/ns/1.0"
			id = "org.apache.cordova.MyApp"
			versionCode="10" 
			version   = "1.0.0">

			<gap:plugin name="Pushwoosh" version="1.3.5" />

		</widget>

## Additional Resources

	Behind the scenes ...

	When the plugin is packaged with Gimlet Packager the Plugin name and version that will be used within the <gap:plugin name="Pushwoosh" version="1.3.5"> are specified.

	Then when the plugin is deployed, the Gimlet server instance will contain subfolders named plugin/Pushwoosh/1.3.5 for the platform being built. These will contain the plugin source code along with a Plugin.xml that specifies the list of source files and a reference to the native class instance for the plugin.
	It looks something like this ...
	<platform name="ios">
        <config-file target="config.xml" parent="plugins">
            <plugin name="PushNotification"
            value="PushNotification" onload="true"/>
        </config-file>

        <access origin="*.pushwoosh.com" />

        <header-file src="PushNotification.h" />
        <source-file src="PushNotification.m" />
		
        <header-file src="HtmlWebViewController.h" />
        <source-file src="HtmlWebViewController.m" />

        <header-file src="PushNotificationManager.h" />
        <source-file src="PushNotificationManager.m" />

        <header-file src="PWGetNearestZoneRequest.h" />
        <source-file src="PWGetNearestZoneRequest.m" />

        <header-file src="PWApplicationEventRequest.h" />
        <source-file src="PWApplicationEventRequest.m" />

        <header-file src="PWPushStatRequest.h" />
        <source-file src="PWPushStatRequest.m" />

        <header-file src="PWRegisterDeviceRequest.h" />
        <source-file src="PWRegisterDeviceRequest.m" />

        <header-file src="PWRequest.h" />
        <source-file src="PWRequest.m" />

        <header-file src="PWRequestManager.h" />
        <source-file src="PWRequestManager.m" />

        <header-file src="PWGetTagsRequest.h" />
        <source-file src="PWGetTagsRequest.m" />

        <header-file src="PWSetTagsRequest.h" />
        <source-file src="PWSetTagsRequest.m" />

        <header-file src="PWAppOpenRequest.h" />
        <source-file src="PWAppOpenRequest.m" />
		
        <header-file src="PWSendBadgeRequest.h" />
        <source-file src="PWSendBadgeRequest.m" />
    </platform>



## Acknowledgments
