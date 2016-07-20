//
// PushNotification.h
//
// Based on the Push Notifications Cordova Plugin by Olivier Louvignes on 06/05/12.
// Modified by Max Konev on 18/05/12.
//
// Pushwoosh Push Notifications Plugin for Cordova iOS
// www.pushwoosh.com
//
// MIT Licensed

#import <Foundation/Foundation.h>
#import <Cordova/CDV.h>
#import <Cordova/CDVPlugin.h>
#import "PushNotificationManager.h"

@interface PushNotification : CDVPlugin <PushNotificationDelegate> 

@property (nonatomic, retain) NSMutableDictionary *callbackIds;
@property (nonatomic, retain) PushNotificationManager *pushManager;
@property (nonatomic, copy) NSDictionary *startPushData;
@property (nonatomic, assign) BOOL startPushCleared;
@property (nonatomic, assign) BOOL deviceReady;

- (void)registerDevice:(CDVInvokedUrlCommand *)command;
- (void)unregisterDevice:(CDVInvokedUrlCommand *)command;
- (void)setTags:(CDVInvokedUrlCommand *)command;
- (void)sendLocation:(CDVInvokedUrlCommand *)command;
- (void)startLocationTracking:(CDVInvokedUrlCommand *)command;
- (void)stopLocationTracking:(CDVInvokedUrlCommand *)command;

- (void)onDeviceReady:(CDVInvokedUrlCommand *)command;
- (void)onDidRegisterForRemoteNotificationsWithDeviceToken:(NSString *)deviceToken;
- (void)onDidFailToRegisterForRemoteNotificationsWithError:(NSError *)error;
- (void)getRemoteNotificationStatus:(CDVInvokedUrlCommand *)command;
- (void)setApplicationIconBadgeNumber:(CDVInvokedUrlCommand *)command;
- (void)cancelAllLocalNotifications:(CDVInvokedUrlCommand *)command;

@end
