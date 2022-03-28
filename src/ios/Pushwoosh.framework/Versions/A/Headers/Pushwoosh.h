//
//  Pushwoosh.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2020
//

#import <Foundation/Foundation.h>

#if TARGET_OS_IOS || TARGET_OS_WATCH

#import <UserNotifications/UserNotifications.h>

#endif

#if TARGET_OS_IOS

#import <StoreKit/StoreKit.h>

#endif

#define PUSHWOOSH_VERSION @"6.3.5"


@class Pushwoosh, PWMessage, PWNotificationCenterDelegateProxy;


typedef void (^PushwooshRegistrationHandler)(NSString *token, NSError *error);
typedef void (^PushwooshGetTagsHandler)(NSDictionary *tags);
typedef void (^PushwooshErrorHandler)(NSError *error);


/**
 `PWMessagingDelegate` protocol defines the methods that can be implemented in the delegate of the `Pushwoosh` class' singleton object.
 These methods provide information about the key events for push notification manager such as, receiving push notifications and opening the received notification.
 These methods implementation allows to react on these events properly.
 */
@protocol PWMessagingDelegate <NSObject>

@optional
/**
 Tells the delegate that the application has received a remote notification.
 
 @param pushwoosh The push manager that received the remote notification.
 @param message A PWMessage object that contains information referring to the remote notification, potentially including a badge number for the application icon, an alert sound, an alert message to display to the user, a notification identifier, and custom data.
*/
- (void)pushwoosh:(Pushwoosh *)pushwoosh onMessageReceived:(PWMessage *)message;

/**
Tells the delegate that the user has pressed on the push notification banner.

@param pushwoosh The push manager that received the remote notification.
@param message A PWMessage object that contains information about the remote notification, potentially including a badge number for the application icon, an alert sound, an alert message to display to the user, a notification identifier, and custom data.
*/
- (void)pushwoosh:(Pushwoosh *)pushwoosh onMessageOpened:(PWMessage *)message;

@end


/**
 Message from Pushwoosh.
*/
@interface PWMessage : NSObject

/**
 Title of the push message.
*/
@property (nonatomic, readonly) NSString *title;

/**
 Subtitle of the push message.
*/
@property (nonatomic, readonly) NSString *subTitle;

/**
 Body of the push message.
*/
@property (nonatomic, readonly) NSString *message;

/**
 Badge number of the push message.
*/
@property (nonatomic, readonly) NSUInteger badge;

/**
 Remote URL or deeplink from the push message.
*/
@property (nonatomic, readonly) NSString *link;

/**
 Returns YES if this message received/opened then the app is in foreground state.
*/
@property (nonatomic, readonly, getter=isForegroundMessage) BOOL foregroundMessage;

/**
 Returns YES if this message contains 'content-available' key (silent or newsstand push).
*/
@property (nonatomic, readonly, getter=isContentAvailable) BOOL contentAvailable;

/**
 Returns YES if this is inbox message.
*/
@property (nonatomic, readonly, getter=isInboxMessage) BOOL inboxMessage;

/**
 Gets custom JSON data from push notifications dictionary as specified in Pushwoosh Control Panel.
*/
@property (nonatomic, readonly) NSDictionary *customData;

/**
 Original payload of the message.
*/
@property (nonatomic, readonly) NSDictionary *payload;

/**
 Returns YES if this message is recieved from Pushwoosh.
*/
+ (BOOL)isPushwooshMessage:(NSDictionary *)userInfo;

@end


/**
 `Pushwoosh` class offers access to the singleton-instance of the push manager responsible for registering the device with the APS servers, receiving and processing push notifications.
 */
@interface Pushwoosh : NSObject

/**
 Pushwoosh Application ID. Usually retrieved automatically from Info.plist parameter `Pushwoosh_APPID`
 */
@property (nonatomic, copy, readonly) NSString *applicationCode;

/**
 `PushNotificationDelegate` protocol delegate that would receive the information about events for push notification manager such as registering with APS services, receiving push notifications or working with the received notification.
 Pushwoosh Runtime sets it to ApplicationDelegate by default
 */
@property (nonatomic, weak) NSObject<PWMessagingDelegate> *delegate;

#if TARGET_OS_IOS || TARGET_OS_WATCH

/**
 Show push notifications alert when push notification is received while the app is running, default is `YES`
 */
@property (nonatomic, assign) BOOL showPushnotificationAlert;

/**
 Authorization options in addition to UNAuthorizationOptionBadge | UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionCarPlay.
 */
@property (nonatomic) UNAuthorizationOptions additionalAuthorizationOptions __IOS_AVAILABLE(12.0);

#endif

/**
 Returns push notification payload if the app was started in response to push notification or null otherwise
 */
@property (nonatomic, copy, readonly) NSDictionary *launchNotification;

/**
 Proxy contains UNUserNotificationCenterDelegate objects.
*/
@property (nonatomic, readonly) PWNotificationCenterDelegateProxy *notificationCenterDelegateProxy;

/**
 Set custom application language. Must be a lowercase two-letter code according to ISO-639-1 standard ("en", "de", "fr", etc.).
 Device language used by default.
 Set to nil if you want to use device language again.
 */
@property (nonatomic) NSString *language;

/**
 Initializes Pushwoosh.
 @param appCode Pushwoosh App ID.
 */
+ (void)initializeWithAppCode:(NSString *)appCode;

/**
 Returns an object representing the current push manager.
 
 @return A singleton object that represents the push manager.
 */
+ (instancetype)sharedInstance;

/**
 Registers for push notifications. By default registeres for "UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound | UIRemoteNotificationTypeAlert" flags.
 Automatically detects if you have "newsstand-content" in "UIBackgroundModes" and adds "UIRemoteNotificationTypeNewsstandContentAvailability" flag.
 */
- (void)registerForPushNotifications;
- (void)registerForPushNotificationsWithCompletion:(PushwooshRegistrationHandler)completion;

/**
Unregisters from push notifications.
*/
- (void)unregisterForPushNotifications;
- (void)unregisterForPushNotificationsWithCompletion:(void (^)(NSError *error))completion;

/**
 Handle registration to remote notifications.
*/
- (void)handlePushRegistration:(NSData *)devToken;
- (void)handlePushRegistrationFailure:(NSError *)error;

/**
 Handle received push notification.
*/
- (BOOL)handlePushReceived:(NSDictionary *)userInfo;

/**
 * Change default base url to reverse proxy url
 * @param url - reverse proxy url
*/
- (void)setReverseProxy:(NSString *)url;

/**
 * Disables reverse proxy
*/
- (void)disableReverseProxy;

/**
 Send tags to server. Tag names have to be created in the Pushwoosh Control Panel. Possible tag types: Integer, String, Incremental (integer only), List tags (array of values).
 
 Example:
 @code
 NSDictionary *tags =  @{ @"Alias" : aliasField.text,
                      @"FavNumber" : @([favNumField.text intValue]),
                          @"price" : [PWTags incrementalTagWithInteger:5],
                           @"List" : @[ @"Item1", @"Item2", @"Item3" ]
 };
    
 [[PushNotificationManager pushManager] setTags:tags];
 @endcode
 
 @param tags Dictionary representation of tags to send.
 */
- (void)setTags:(NSDictionary *)tags;

/**
 Send tags to server with completion block. If setTags succeeds competion is called with nil argument. If setTags fails completion is called with error.
 */
- (void)setTags:(NSDictionary *)tags completion:(void (^)(NSError *error))completion;

- (void)setEmailTags:(NSDictionary *)tags forEmail:(NSString *)email;

- (void)setEmailTags:(NSDictionary *)tags forEmail:(NSString *)email completion:(void(^)(NSError *error))completion;

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
- (void)getTags:(PushwooshGetTagsHandler)successHandler onFailure:(PushwooshErrorHandler)errorHandler;

/**
 Sends current badge value to server. Called internally by SDK Runtime when `UIApplication` `setApplicationBadgeNumber:` is set. This function is used for "auto-incremeting" badges to work.
 This way Pushwoosh server can know what current badge value is set for the application.
 
 @param badge Current badge value.
 */
- (void)sendBadges:(NSInteger)badge __API_AVAILABLE(macos(10.10), ios(8.0));

/**
 Pushwoosh SDK version.
*/
+ (NSString *)version;

#if TARGET_OS_IOS
/**
 Sends in-app purchases to Pushwoosh. Use in paymentQueue:updatedTransactions: payment queue method (see example).
 
 Example:
 @code
 - (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transactions {
     [[PushNotificationManager pushManager] sendSKPaymentTransactions:transactions];
 }
 @endcode
 
 @param transactions Array of SKPaymentTransaction items as received in the payment queue.
 */
- (void)sendSKPaymentTransactions:(NSArray *)transactions;

/**
 Tracks individual in-app purchase. See recommended `sendSKPaymentTransactions:` method.
 
 @param productIdentifier purchased product ID
 @param price price for the product
 @param currencyCode currency of the price (ex: @"USD")
 @param date time of the purchase (ex: [NSDate now])
 */
- (void)sendPurchase:(NSString *)productIdentifier withPrice:(NSDecimalNumber *)price currencyCode:(NSString *)currencyCode andDate:(NSDate *)date;

#endif
/**
 Gets current push token.
 
 @return Current push token. May be nil if no push token is available yet.
 */
- (NSString *)getPushToken;

/**
 Gets HWID. Unique device identifier that used in all API calls with Pushwoosh.
 This is identifierForVendor for iOS >= 7.
 
 @return Unique device identifier.
 */
- (NSString *)getHWID;

/**
 Returns dictionary with enabled remove notificaton types.
 
 Example enabled push:
 @code
 {
    enabled = 1;
    pushAlert = 1;
    pushBadge = 1;
    pushSound = 1;
    type = 7;
 }
 @endcode
 where "type" field is UIUserNotificationType
 
 Disabled push:
 @code
 {
    enabled = 1;
    pushAlert = 0;
    pushBadge = 0;
    pushSound = 0;
    type = 0;
 }
 @endcode
 
 Note: In the latter example "enabled" field means that device can receive push notification but could not display alerts (ex: silent push)
 */
+ (NSMutableDictionary *)getRemoteNotificationStatus;

/**
 Clears the notifications from the notification center.
 */
+ (void)clearNotificationCenter;

/**
 Set User indentifier. This could be Facebook ID, username or email, or any other user ID.
 This allows data and events to be matched across multiple user devices.
 If setUserId succeeds competion is called with nil argument. If setUserId fails completion is called with error.
 
 @param userId user identifier
 */
- (void)setUserId:(NSString *)userId completion:(void(^)(NSError * error))completion;

/**
 Set User indentifier. This could be Facebook ID, username or email, or any other user ID.
 This allows data and events to be matched across multiple user devices.
 
 @param userId user identifier
 */
- (void)setUserId:(NSString *)userId;

/**
 Set User indentifier. This could be Facebook ID, username or email, or any other user ID.
 This allows data and events to be matched across multiple user devices.
 If setUser succeeds competion is called with nil argument. If setUser fails completion is called with error.
 
 @param userId user identifier
 @param emails user's emails array
 */
- (void)setUser:(NSString *)userId emails:(NSArray *)emails completion:(void(^)(NSError * error))completion;


/**
 Set User indentifier. This could be Facebook ID, username or email, or any other user ID.
 This allows data and events to be matched across multiple user devices.
 
 @param userId user identifier
 @param emails user's emails array
 */
- (void)setUser:(NSString *)userId emails:(NSArray *)emails;

/**
 Set User indentifier. This could be Facebook ID, username or email, or any other user ID.
 This allows data and events to be matched across multiple user devices.
 If setUser succeeds competion is called with nil argument. If setUser fails completion is called with error.
 
 @param userId user identifier
 @param email user's email string
 */
- (void)setUser:(NSString *)userId email:(NSString *)email completion:(void(^)(NSError * error))completion;

/**
 Register emails list associated to the current user.
 If setEmails succeeds competion is called with nil argument. If setEmails fails completion is called with error.
 
 @param emails user's emails array
 */
- (void)setEmails:(NSArray *)emails completion:(void(^)(NSError * error))completion;

/**
 Register emails list associated to the current user.
 
 @param emails user's emails array
 */
- (void)setEmails:(NSArray *)emails;

/**
 Register email associated to the current user. Email should be a string and could not be null or empty.
 If setEmail succeeds competion is called with nil argument. If setEmail fails completion is called with error.
 
 @param email user's email string
 */
- (void)setEmail:(NSString *)email completion:(void(^)(NSError * error))completion;

/**
 Register email associated to the current user. Email should be a string and could not be null or empty.
 
 @param email user's email string
 */
- (void)setEmail:(NSString *)email;

/**
 Move all events from oldUserId to newUserId if doMerge is true. If doMerge is false all events for oldUserId are removed.
 
 @param oldUserId source user
 @param newUserId destination user
 @param doMerge if false all events for oldUserId are removed, if true all events for oldUserId are moved to newUserId
 @param completion callback
 */
- (void)mergeUserId:(NSString *)oldUserId to:(NSString *)newUserId doMerge:(BOOL)doMerge completion:(void (^)(NSError *error))completion;

/**
 Starts communication with Pushwoosh server.
 */
- (void)startServerCommunication;

/**
 Stops communication with Pushwoosh server.
*/
- (void)stopServerCommunication;

/**
 Process URL of some deep link. Primarly used for register test devices.

 @param url Deep Link URL
*/
#if TARGET_OS_IOS || TARGET_OS_WATCH
- (BOOL)handleOpenURL:(NSURL *)url;
#endif

@end

/**
`PWNotificationCenterDelegateProxy` class handles notifications on iOS 10 and forwards methods of UNUserNotificationCenterDelegate to all added delegates.
*/
#if TARGET_OS_IOS || TARGET_OS_WATCH
@interface PWNotificationCenterDelegateProxy : NSObject <UNUserNotificationCenterDelegate>
#elif TARGET_OS_OSX
@interface PWNotificationCenterDelegateProxy : NSObject <NSUserNotificationCenterDelegate>
#endif
/**
 Returns UNUserNotificationCenterDelegate that handles foreground push notifications on iOS10
*/
#if TARGET_OS_IOS || TARGET_OS_WATCH
@property (nonatomic, strong, readonly) id<UNUserNotificationCenterDelegate> defaultNotificationCenterDelegate;
#elif TARGET_OS_OSX
@property (nonatomic, strong, readonly) id<NSUserNotificationCenterDelegate> defaultNotificationCenterDelegate;
#endif

/**
 Adds extra UNUserNotificationCenterDelegate that handles foreground push notifications on iOS10.
*/
#if TARGET_OS_IOS || TARGET_OS_WATCH
- (void)addNotificationCenterDelegate:(id<UNUserNotificationCenterDelegate>)delegate;
#endif
@end


/**
`PWTagsBuilder` class encapsulates the methods for creating tags parameters for sending them to the server.
*/
@interface PWTagsBuilder : NSObject
/**
 Creates a dictionary for incrementing/decrementing a numeric tag on the server.
 
 Example:
 @code
 NSDictionary *tags = @{
     @"Alias" : aliasField.text,
     @"FavNumber" : @([favNumField.text intValue]),
     @"price": [PWTags incrementalTagWithInteger:5],
 };
 
 [[PushNotificationManager pushManager] setTags:tags];
 @endcode
 
 @param delta Difference that needs to be applied to the tag's counter.
 
 @return Dictionary, that needs to be sent as the value for the tag
 */
+ (NSDictionary *)incrementalTagWithInteger:(NSInteger)delta;

/**
 Creates a dictionary for extending Tag’s values list with additional values
 
 Example:
 
 @code
 NSDictionary *tags = @{
     @"Alias" : aliasField.text,
     @"FavNumber" : @([favNumField.text intValue]),
     @"List" : [PWTags appendValuesToListTag:@[ @"Item1" ]]
 };
 
 [[PushNotificationManager pushManager] setTags:tags];
 @endcode
 
 @param array Array of values to be added to the tag.
 
 @return Dictionary to be sent as the value for the tag
 */
+ (NSDictionary *)appendValuesToListTag:(NSArray<NSString *> *)array;

@end
