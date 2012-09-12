//
//  PushNotificationManager.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@class PushNotificationManager;
@class CLLocation;

@protocol PushNotificationDelegate

@optional
//handle push notification, display alert, if this method is implemented onPushAccepted will not be called, internal message boxes will not be displayed
- (void) onPushReceived:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification onStart:(BOOL)onStart;

//user pressed OK on the push notification
- (void) onPushAccepted:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification;
@end

typedef enum enumHtmlPageSupportedOrientations {
	PWOrientationPortrait = 1 << 0,
	PWOrientationPortraitUpsideDown = 1 << 1,
	PWOrientationLandscapeLeft = 1 << 2,
	PWOrientationLandscapeRight = 1 << 3,
} PWSupportedOrientations;

@interface PushNotificationManager : NSObject {
	NSString *appCode;
	NSString *appName;
	UIViewController *navController;

	NSInteger internalIndex;
	NSMutableDictionary *pushNotifications;
	NSObject<PushNotificationDelegate> *delegate;
}

@property (nonatomic, copy) NSString *appCode;
@property (nonatomic, copy) NSString *appName;
@property (nonatomic, assign) UIViewController *navController;
@property (nonatomic, retain) NSDictionary *pushNotifications;
@property (nonatomic, assign) NSObject<PushNotificationDelegate> *delegate;
@property (nonatomic, assign) PWSupportedOrientations supportedOrientations;

+ (void)initializeWithAppCode:(NSString *)appCode appName:(NSString *)appName;

+ (PushNotificationManager *)pushManager;

- (id) initWithApplicationCode:(NSString *)appCode appName:(NSString *)appName;
- (id) initWithApplicationCode:(NSString *)appCode navController:(UIViewController *) navController appName:(NSString *)appName;

//send tags to server
- (void) setTags: (NSDictionary *) tags;

//send geolocation to the server
- (void) sendLocation: (CLLocation *) location;

//sends the token to server
- (void) handlePushRegistration:(NSData *)devToken;
- (NSString *) getPushToken;

//if the push is received when the app is running
- (BOOL) handlePushReceived:(NSDictionary *) userInfo;

//gets apn payload
- (NSDictionary *) getApnPayload:(NSDictionary *)pushNotification;

//get custom data from the push payload
- (NSString *) getCustomPushData:(NSDictionary *)pushNotification;

@end
