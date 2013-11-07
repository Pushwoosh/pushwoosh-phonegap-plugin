Cordova Pushwoosh Push Notifications plugin
===================================================

cross-platform PushWoosh for Cordova / PhoneGap

- [x] Support for iOS
- [ ] Support for Android (coming soon - hopefully ;-))

follows the Cordova Plugin spec https://github.com/alunny/cordova-plugin-spec

so that it works with Plugman https://https://github.com/apache/cordova-plugman

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

## Automatic Installation
This plugin is based on [plugman](https://https://github.com/apache/cordova-plugman). to install it to your app,
simply execute pluginstall as follows;

	pluginstall [PLATFORM] [TARGET-PATH] [PLUGIN-PATH]
	
	where
		[PLATFORM] = ios
		[TARGET-PATH] = path to folder containing your phonegap project
		[PLUGIN-PATH] = path to folder containing this plugin

For additional info, take a look at the [Cordova Plugin Specification](https://http://cordova.apache.org/docs/en/3.0.0/plugin_ref_spec.md)


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



## Acknowledgments
