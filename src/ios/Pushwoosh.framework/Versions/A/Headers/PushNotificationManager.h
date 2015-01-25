//
//  PushNotificationManager.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2014
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <StoreKit/StoreKit.h>

@class PushNotificationManager;
@class CLLocation;

typedef NS_ENUM(NSInteger, PWSupportedOrientations) {
	PWOrientationPortrait = 1 << 0,
	PWOrientationPortraitUpsideDown = 1 << 1,
	PWOrientationLandscapeLeft = 1 << 2,
	PWOrientationLandscapeRight = 1 << 3,
};

typedef void(^pushwooshGetTagsHandler)(NSDictionary *tags);
typedef void(^pushwooshErrorHandler)(NSError *error);

/**
 `PushNotificationDelegate` protocol defines the methods that can be implemented in the delegate of the `PushNotificationManager` class' singleton object.
 These methods provide information about the key events for push notification manager such as registering with APS services, receiving push notifications or working with the received notification.
 These methods implementation allows to react on these events properly.
 */
@protocol PushNotificationDelegate

@optional
/**
 Tells the delegate that the application has registered with Apple Push Service (APS) successfully.
 
 @param token A token used for identifying the device with APS.
 */
- (void) onDidRegisterForRemoteNotificationsWithDeviceToken:(NSString *)token;

/**
 Sent to the delegate when Apple Push Service (APS) could not complete the registration process successfully.
 
 @param error An NSError object encapsulating the information about the reason of the registration failure. Within this method you can define application's behaviour in case of registration failure.
 */
- (void) onDidFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

/**
 Tells the delegate that the push manager has received a remote notification.
 
 If this method is implemented `onPushAccepted:withNotification:` will not be called, internal message boxes will not be displayed.
 
 @param pushManager The push manager that received the remote notification.
 @param pushNotification A dictionary that contains information referring to the remote notification, potentially including a badge number for the application icon, an alert sound, an alert message to display to the user, a notification identifier, and custom data.
 The provider originates it as a JSON-defined dictionary that iOS converts to an NSDictionary object; the dictionary may contain only property-list objects plus NSNull.
 @param onStart If the application was not active when the push notification was received, the application will be launched with this parameter equal to `YES`, otherwise the parameter will be `NO`.
 */
- (void) onPushReceived:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification onStart:(BOOL)onStart;

/**
 Tells the delegate that the user has pressed OK on the push notification.
 IMPORTANT: This method is used for backwards compatibility and is deprecated. Please use the `onPushAccepted:withNotification:onStart:` method instead
 
 @param pushManager The push manager that received the remote notification.
 @param pushNotification A dictionary that contains information referring to the remote notification, potentially including a badge number for the application icon, an alert sound, an alert message to display to the user, a notification identifier, and custom data.
 The provider originates it as a JSON-defined dictionary that iOS converts to an NSDictionary object; the dictionary may contain only property-list objects plus NSNull.
 Push dictionary sample:
 
	 {
		 aps =     {
			 alert = "Some text.";
			 sound = default;
		 };
		 p = 1pb;
	 }
 
 */
- (void) onPushAccepted:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification;

/**
 Tells the delegate that the user has pressed OK on the push notification.
 
 @param pushManager The push manager that received the remote notification.
 @param pushNotification A dictionary that contains information about the remote notification, potentially including a badge number for the application icon, an alert sound, an alert message to display to the user, a notification identifier, and custom data.
 The provider originates it as a JSON-defined dictionary that iOS converts to an NSDictionary object; the dictionary may contain only property-list objects plus NSNull.
 Push dictionary sample:
 
	 {
		 aps =     {
			 alert = "Some text.";
			 sound = default;
		 };
		 p = 1pb;
	 }
 
 @param onStart If the application was not active when the push notification was received, the application will be launched with this parameter equal to `YES`, otherwise the parameter will be `NO`.
 */
- (void) onPushAccepted:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification onStart:(BOOL)onStart;

/**
 User has tapped on the action button on Rich Push Page.
 
 @param customData Data associated with rich page button in the Rich Push Editor
 */
- (void) onRichPageButtonTapped:(NSString *)customData;

/**
 Tells the delegate that the push manager has received tags from the server.
 
 @param tags Dictionary representation of received tags.
 Dictionary example:
 
	 {
		 Country = ru;
		 Language = ru;
	 }
 
 */
- (void) onTagsReceived:(NSDictionary *)tags;

/**
 Sent to the delegate when push manager could not complete the tags receiving process successfully.
 
 @param error An NSError object that encapsulates information why receiving tags did not succeed.
 */
- (void) onTagsFailedToReceive:(NSError *)error;
@end


/**
  `PWTags` class encapsulates the methods for creating tags parameters for sending them to the server.
 */
@interface PWTags : NSObject

/**
 Creates a dictionary for incrementing/decrementing a numeric tag on the server.
 
 Example:
 
	NSDictionary *tags = [NSDictionary dictionaryWithObjectsAndKeys:
							aliasField.text, @"Alias",
							[NSNumber numberWithInt:[favNumField.text intValue]], @"FavNumber",
							[PWTags incrementalTagWithInteger:5], @"price",
							nil];

	[[PushNotificationManager pushManager] setTags:tags];
 
 @param delta Difference that needs to be applied to the tag's counter.
 
 @return Dictionary, that needs to be sent as the value for the tag
 */
+ (NSDictionary *) incrementalTagWithInteger:(NSInteger)delta;

@end


/**
  `PushNotificationManager` class offers access to the singletone-instance of the push manager responsible for registering the device with the APS servers, receiving and processing push notifications.
 */
@interface PushNotificationManager : NSObject <SKPaymentTransactionObserver> {
	NSString *appCode;
	NSString *appName;

	UIWindow *richPushWindow;
	NSInteger internalIndex;
	NSMutableDictionary *pushNotifications;
	NSObject<PushNotificationDelegate> *__unsafe_unretained delegate;
}

/**
 Pushwoosh Application ID. Usually retrieved automatically from Info.plist parameter `Pushwoosh_APPID`
 */
@property (nonatomic, copy) NSString *appCode;

/**
 Application name. Usually retrieved automatically from Info.plist bundle name (CFBundleDisplayName). Could be used to override bundle name. In addition could be set in Info.plist as `Pushwoosh_APPNAME` parameter.

 Example logic from Pushwoosh SDK Runtime:
 
	 NSString * appname = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"Pushwoosh_APPNAME"];
	 if(!appname)
	 appname = [[NSUserDefaults standardUserDefaults] objectForKey:@"Pushwoosh_APPNAME"];
	 
	 if(!appname)
	 appname = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"];
	 
	 if(!appname)
	 appname = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleName"];
	 
	 if(!appname) {
	 appname = @"";
	 }
	 
	 instance = [[PushNotificationManager alloc] initWithApplicationCode:appid appName:appname ];
 */
@property (nonatomic, copy) NSString *appName;

/**
 `PushNotificationDelegate` protocol delegate that would receive the information about events for push notification manager such as registering with APS services, receiving push notifications or working with the received notification.
 Pushwoosh Runtime sets it to ApplicationDelegate by default
 */
@property (nonatomic, assign) NSObject<PushNotificationDelegate> *delegate;

@property (nonatomic, retain) UIWindow *richPushWindow;
@property (nonatomic, retain) NSDictionary *pushNotifications;
@property (nonatomic, assign) PWSupportedOrientations supportedOrientations;

/**
 Show push notifications alert when push notification is received while the app is running, default is `YES`
 */
@property (nonatomic, assign) BOOL showPushnotificationAlert;

/**
 Initializes PushNotificationManager. Usually called by Pushwoosh Runtime internally.
 @param appcCode Pushwoosh App ID.
 @param appName Application name.
 */
+ (void)initializeWithAppCode:(NSString *)appCode appName:(NSString *)appName;

/**
 Returns an object representing the current push manager.
 
 @return A singleton object that represents the push manager.
 */
+ (PushNotificationManager *)pushManager;

/**
 Registers for push notifications. By default registeres for "UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound | UIRemoteNotificationTypeAlert" flags.
 Automatically detects if you have "newsstand-content" in "UIBackgroundModes" and adds "UIRemoteNotificationTypeNewsstandContentAvailability" flag.
 */
- (void) registerForPushNotifications;

/**
 Unregisters from push notifications. You should call this method in rare circumstances only, such as when a new version of the app drops support for remote notifications. Users can temporarily prevent apps from receiving remote notifications through the Notifications section of the Settings app. Apps unregistered through this method can always re-register.
 */
- (void) unregisterForPushNotifications;

+ (BOOL) getAPSProductionStatus;

- (id) initWithApplicationCode:(NSString *)appCode appName:(NSString *)appName;
- (id) initWithApplicationCode:(NSString *)appCode navController:(UIViewController *) navController appName:(NSString *)appName __attribute__((deprecated));
- (void) showWebView;

/**
 Start location tracking.
 */
- (void) startLocationTracking;

/**
 Stops location tracking
 */
- (void) stopLocationTracking;

/**
 Start iBeacon tracking.
 */
- (void) startBeaconTracking;

/**
 Stops iBeacon tracking
 */
- (void) stopBeaconTracking;

/**
 Send tags to server. Tag names have to be created in the Pushwoosh Control Panel. Possible tag types: Integer, String, Incremental (integer only), List tags (array of values).
 
 Example:
 
	 NSDictionary *tags = [NSDictionary dictionaryWithObjectsAndKeys:
							 aliasField.text, @"Alias",
							 [NSNumber numberWithInt:[favNumField.text intValue]], @"FavNumber",
							 [PWTags incrementalTagWithInteger:5], @"price",
							 [NSArray arrayWithObjects:@"Item1", @"Item2", @"Item3", nil], @"List",
							 nil];
	
	 [[PushNotificationManager pushManager] setTags:tags];
 
 @param tags Dictionary representation of tags to send.
 */
- (void) setTags: (NSDictionary *) tags;

/**
 Get tags from the server. Calls delegate method `onTagsReceived:` or `onTagsFailedToReceive:` depending on the results.
 */
- (void) loadTags;

/**
 Get tags from server. Calls delegate method if exists and handler (block).
 
 @param successHandler The block is executed on the successful completion of the request. This block has no return value and takes one argument: the dictionary representation of the recieved tags.
 Example of the dictionary representation of the received tags:
 
	 {
		 Country = ru;
		 Language = ru;
	 }
 
 @param errorHandler The block is executed on the unsuccessful completion of the request. This block has no return value and takes one argument: the error that occurred during the request.
 */
- (void) loadTags: (pushwooshGetTagsHandler) successHandler error:(pushwooshErrorHandler) errorHandler;

/**
 Informs the Pushwoosh about the app being launched. Usually called internally by SDK Runtime.
 */
- (void) sendAppOpen;

/**
 Sends current badge value to server. Called internally by SDK Runtime when `UIApplication` `setApplicationBadgeNumber:` is set. This function is used for "auto-incremeting" badges to work.
 This way Pushwoosh server can know what current badge value is set for the application.
 
 @param badge Current badge value.
 */
- (void) sendBadges: (NSInteger) badge;

/**
 Sends geolocation to the server for GeoFencing push technology. Called internally, please use `startLocationTracking` and `stopLocationTracking` functions.
 
 @param location Location to be sent.
 */
- (void) sendLocation: (CLLocation *) location;

/**
 Records stats for a goal in the application, like in-app purchase, user reaching a specific point at the game etc. This function could be used to see the performance of marketing push notification.
 
 Example:
 
	[[PushNotificationManager pushManager] recordGoal:@"purchase1"];
 
 @param goal Goal string.
 */
- (void) recordGoal: (NSString *) goal;

/**
 Records stats for a goal in the application, like in-app purchase, user reaching a specific point at the game.
 Additional count parameter is responsible for storing the additional information about the goal achieved like price of the purchase e.t.c.
 
 Example:
 
	[[PushNotificationsManager pushManager] recordGoal:@"purchase" withCount:[NSNumber numberWithInt:"10"];
  
 @param goal Goal string.
 @param count Count parameter. Must be integer value.
 */
- (void) recordGoal: (NSString *) goal withCount: (NSNumber *) count;

/**
 Gets current push token.
 
 @return Current push token. May be nil if no push token is available yet.
 */
- (NSString *) getPushToken;

/**
 Gets HWID. Unique device identifier that used in all API calls with Pushwoosh.
 This is identifierForVendor for iOS >= 7.
 
 @return Unique device identifier.
 */
- (NSString *) getHWID;

- (void) handlePushRegistration:(NSData *)devToken;
- (void) handlePushRegistrationString:(NSString *)deviceID;

//internal
- (void) handlePushRegistrationFailure:(NSError *) error;

//if the push is received while the app is running. internal
- (BOOL) handlePushReceived:(NSDictionary *) userInfo;


/**
 Gets APN payload from push notifications dictionary.
 
 Example:
 
	 - (void) onPushAccepted:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification onStart:(BOOL)onStart {
		NSDictionary * apnPayload = [[PushNotificationsManager pushManager] getApnPayload:pushNotification];
		NSLog(@"%@", apnPayload);
	 }

 For Push dictionary sample:
 
	 {
		aps =     {
			alert = "Some text.";
			sound = default;
		};
		p = 1pb;
	 }

 Result is:
 
	 {
		alert = "Some text.";
		sound = default;
	 };

 @param pushNotification Push notifications dictionary as received in `onPushAccepted: withNotification: onStart:`
 */
- (NSDictionary *) getApnPayload:(NSDictionary *)pushNotification;

/**
 Gets custom JSON data from push notifications dictionary as specified in Pushwoosh Control Panel.
 
 Example:
 
	 - (void) onPushAccepted:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification onStart:(BOOL)onStart {
		NSString * customData = [[PushNotificationsManager pushManager] getCustomPushData:pushNotification];
		NSLog(@"%@", customData);
	 }
 
 @param pushNotification Push notifications dictionary as received in `onPushAccepted: withNotification: onStart:`
 */
- (NSString *) getCustomPushData:(NSDictionary *)pushNotification;

/**
 Clears the notifications from the notification center.
 */
+ (void) clearNotificationCenter;

/**
 Internal function
 */
- (NSDictionary *) getPage:(NSString *)pageId;

/**
 Internal function
 */
- (void) onRichPageButtonTapped:(NSString *)customData;

@end
