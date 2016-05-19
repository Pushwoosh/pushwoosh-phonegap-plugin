Cordova Pushwoosh Push Notifications plugin
===================================================

Cross-Platform push notifications by Pushwoosh for Cordova / PhoneGap

follows the Cordova Plugin spec http://cordova.apache.org/docs/en/3.0.0/plugin_ref_spec.md  
so that it works with Plugman https://https://github.com/apache/cordova-plugman

###Platform integration guides are available on Pushwoosh:
####iOS:
http://www.pushwoosh.com/programming-push-notification/ios/ios-additional-platforms/push-notification-sdk-integration-for-phonegap/

####Android:
http://www.pushwoosh.com/programming-push-notification/android/android-additional-platforms/phonegapcordova-sdk-integration/

####WP8:
http://www.pushwoosh.com/programming-push-notification/windows-phone/wp-additional-platforms/windows-phone-cordova-sdk-integration-guide/

###Plugin documentation:  
https://rawgit.com/Pushwoosh/pushwoosh-phonegap-3.0-plugin/master/Documentation/files/PushNotification-js.html

###Experimental Support For React Native Android:
By using the [react-native-cordova-plugin](https://github.com/axemclion/react-native-cordova-plugin) package, Cordova plugins can be used with React Native applications (only Android right now).

To add this plugin to a React Native Android project:
- Run `npm install --save react-native-cordova-plugin`
- Follow the instructions to finish the installation in the [package docs](https://github.com/axemclion/react-native-cordova-plugin)
- Run `./node_modules/.bin/cordova-plugin add https://github.com/UpChannel/pushwoosh-phonegap-plugin`

Then in your JS you can use the API similarly, with three key differences:
```javascript
// need to require Cordova:
var Cordova = require('react-native-cordova-plugin');
...
// need to require PushNotification plugin as such:
var pushNotification = Cordova.require("pushwoosh-cordova-plugin.PushNotification");
...
// Need to set a callback for incoming push notifications instead of an event listener:
pushNotification.setNotificationCallback(function(event){
	...
});
// DO NOT USE FOLLOWING IN REACT NATIVE (WILL ERROR)
document.addEventListener('push-notification', function(event) {
	...
});
```
These differences are due to the different Javascript execution environment in React Native. Since there is no window or document object, we cannot use either of those APIs.

## Acknowledgments
Plugman support by Platogo

HUGE thanks to Eddy Verbruggen for all the help with WP8 Phonegap support!!!
https://github.com/EddyVerbruggen


## LICENSE

	The MIT License

	Copyright (c) 2014 Pushwoosh.
	http://www.pushwoosh.com

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
