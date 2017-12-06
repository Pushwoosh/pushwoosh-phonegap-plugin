Cordova Pushwoosh Push Notifications plugin
===================================================

[![GitHub release](https://img.shields.io/github/release/Pushwoosh/pushwoosh-phonegap-plugin.svg?style=flat-square)](https://github.com/Pushwoosh/pushwoosh-phonegap-plugin/releases) 
[![npm](https://img.shields.io/npm/v/pushwoosh-cordova-plugin.svg)](https://www.npmjs.com/package/pushwoosh-cordova-plugin)
[![license](https://img.shields.io/npm/l/pushwoosh-cordova-plugin.svg)](https://www.npmjs.com/package/pushwoosh-cordova-plugin)

![platforms](https://img.shields.io/badge/platforms-android%20%7C%20ios%20%7C%20wp8%20%7C%20windows%20-yellowgreen.svg)

Cross-Platform push notifications by Pushwoosh for Cordova / PhoneGap

### Installation

Starting with Pushwoosh Cordova plugin **v7.1.0**, you need to use [Android Plugin for Gradle v3.0.0](https://developer.android.com/studio/build/gradle-plugin-3-0-0.html) (or higher) with Gradle v4.1 (or higher). You should add Java 8 support as well. To do so you should use [Cordova-android v7.0.0](https://github.com/apache/cordova-android) (or higher):

```
#remove previous android platform
cordova platform remove android

#add new one with cordova-android v7.0.0
cordova platform add android@7.0.0
```

Using npm (requires cordova 7.0+):

```
cordova plugin add pushwoosh-cordova-plugin@7.1.0
```

Using git:

```
cordova plugin add https://github.com/Pushwoosh/pushwoosh-phonegap-plugin.git#7.1.0
```

### Guide

http://docs.pushwoosh.com/docs/cordova-phonegap

### Documentation

http://docs.pushwoosh.com/docs/cordova-api-reference

### Acknowledgments
Plugman support by Platogo

HUGE thanks to Eddy Verbruggen for all the help with WP8 Phonegap support!!!
https://github.com/EddyVerbruggen
