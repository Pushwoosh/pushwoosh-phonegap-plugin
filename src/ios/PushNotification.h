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
#import <Cordova/CDVPlugin.h>
#import "PushNotificationManager.h"

@interface PushNotification : CDVPlugin <PushNotificationDelegate> {

	NSMutableDictionary* callbackIds;
	PushNotificationManager *pushManager;
	NSString *startPushData;
}

@property (nonatomic, retain) NSMutableDictionary* callbackIds;
@property (nonatomic, retain) PushNotificationManager *pushManager;
@property (nonatomic, copy) NSString *startPushData;

- (void)registerDevice:(NSMutableArray *)arguments withDict:(NSMutableDictionary*)options;
- (void)setTags:(NSMutableArray *)arguments withDict:(NSMutableDictionary*)options;
- (void)sendLocation:(NSMutableArray *)arguments withDict:(NSMutableDictionary*)options;

- (void)onDeviceReady:(NSMutableArray *)arguments withDict:(NSMutableDictionary*)options;
- (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSString*)deviceToken;
- (void)didFailToRegisterForRemoteNotificationsWithError:(NSError*)error;
+ (NSMutableDictionary*)getRemoteNotificationStatus;
- (void)getRemoteNotificationStatus:(NSMutableArray *)arguments withDict:(NSMutableDictionary*)options;
- (void)setApplicationIconBadgeNumber:(NSMutableArray *)arguments withDict:(NSMutableDictionary*)options;
- (void)cancelAllLocalNotifications:(NSMutableArray *)arguments withDict:(NSMutableDictionary*)options;

@end

#ifdef DEBUG
#   define DLog(fmt, ...) NSLog((@"%s [Line %d] " fmt), __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__);
#else
#   define DLog(...)
#endif
#define ALog(fmt, ...) NSLog((@"%s [Line %d] " fmt), __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__);
