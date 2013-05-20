//
//  PushNotificationManager.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "HtmlWebViewController.h"
#import "PushRuntime.h"

@class PushNotificationManager;
@class CLLocation;
@class PWLocationTracker;

@protocol PushNotificationDelegate

@optional
//succesfully registered for push notifications
- (void) onDidRegisterForRemoteNotificationsWithDeviceToken:(NSString *)token;

//failed to register for push notifications
- (void) onDidFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

//handle push notification, display alert, if this method is implemented onPushAccepted will not be called, internal message boxes will not be displayed
- (void) onPushReceived:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification onStart:(BOOL)onStart;

//user pressed OK on the push notification
- (void) onPushAccepted:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification;

//user pressed OK on the push notification
- (void) onPushAccepted:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification onStart:(BOOL)onStart;
@end

@interface PushNotificationManager : NSObject <HtmlWebViewControllerDelegate> {
	NSString *appCode;
	NSString *appName;

	UIWindow *richPushWindow;
	NSInteger internalIndex;
	NSMutableDictionary *pushNotifications;
	NSObject<PushNotificationDelegate> *delegate;
}

@property (nonatomic, copy) NSString *appCode;
@property (nonatomic, copy) NSString *appName;
@property (nonatomic, retain) UIWindow *richPushWindow;
@property (nonatomic, retain) NSDictionary *pushNotifications;
@property (nonatomic, assign) NSObject<PushNotificationDelegate> *delegate;
@property (nonatomic, assign) PWSupportedOrientations supportedOrientations;
@property (nonatomic, retain) PWLocationTracker *locationTracker;

//show push notifications alert when push notification received and the app is running, default is TRUE
@property (nonatomic, assign) BOOL showPushnotificationAlert;

+ (void)initializeWithAppCode:(NSString *)appCode appName:(NSString *)appName;

+ (PushNotificationManager *)pushManager;

+ (BOOL) getAPSProductionStatus;

- (id) initWithApplicationCode:(NSString *)appCode appName:(NSString *)appName;
- (id) initWithApplicationCode:(NSString *)appCode navController:(UIViewController *) navController appName:(NSString *)appName __attribute__((deprecated));
- (void) showWebView;

//start location tracking. Specify mode in Info.plist, key - Pushwoosh_BGMODE
//Modes are:
//"PWTrackingDisabled" - no tracking in background (default)
//"PWTrackSignificantLocationChanges" - this is battery efficient and uses network triangulation in background
//"PWTrackAccurateLocationChanges" - uses GPS in background and drains the battery. You have to specify "location" background mode as per iOS requirements.
- (void) startLocationTracking;
- (void) startLocationTracking:(NSString *)mode;

//stops location tracking
- (void) stopLocationTracking;

//send tags to server
- (void) setTags: (NSDictionary *) tags;

//records application open
- (void) sendAppOpen;

//sends current badge value to server
- (void) sendBadges: (NSInteger) badge;

//send geolocation to the server
- (void) sendLocation: (CLLocation *) location;

//records stats for a goal in the application, like purchase e.t.c.
- (void) recordGoal: (NSString *) goal;

//same as above plus additional count parameter
- (void) recordGoal: (NSString *) goal withCount: (NSNumber *) count;

//sends the token to server
- (void) handlePushRegistration:(NSData *)devToken;
- (void) handlePushRegistrationString:(NSString *)deviceID;
- (NSString *) getPushToken;

//internal
- (void) handlePushRegistrationFailure:(NSError *) error;

//if the push is received when the app is running
- (BOOL) handlePushReceived:(NSDictionary *) userInfo;

//gets apn payload
- (NSDictionary *) getApnPayload:(NSDictionary *)pushNotification;

//get custom data from the push payload
- (NSString *) getCustomPushData:(NSDictionary *)pushNotification;

//clears the notifications from the notification center
+ (void) clearNotificationCenter;

@end
