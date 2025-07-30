//
//  PushNotification.m
//
// Based on the Push Notifications Cordova Plugin by Olivier Louvignes on 06/05/12.
// Modified by Max Konev on 18/05/12.
//
// Pushwoosh Push Notifications Plugin for Cordova iOS
// www.pushwoosh.com
// (c) Pushwoosh 2025
//
// MIT Licensed

#import "PushNotification.h"
#import "PWLog.h"
#import <PushwooshInboxUI/PushwooshInboxUI.h>
#import <PushwooshFramework/PWGDPRManager.h>
#import <PushwooshFramework/PWInAppManager.h>
#import <PushwooshFramework/PushNotificationManager.h>
#import <PushwooshFramework/PWInbox.h>
#import "PWBackward.h"

#import "AppDelegate.h"
#import <UserNotifications/UserNotifications.h>

#if __has_include(<PushwooshVoIP/PushwooshVoIP.h>)
#import <PushwooshVoIP/PushwooshVoIP.h>
#import <CallKit/CallKit.h>
#import <AVFoundation/AVFoundation.h>
#define PW_VOIP_ENABLED 1
#else
#define PW_VOIP_ENABLED 0
#endif

#import <UserNotifications/UserNotifications.h>

#import <objc/runtime.h>


#define WRITEJS(VAL) [NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", VAL]

NSMutableDictionary *callbackIds;
NSDictionary* pendingCallFromRecents;
BOOL monitorAudioRouteChange = NO;
BOOL initSupportsVideo = NO;
NSString *ringtoneSound;
NSInteger handleType;

@interface PWCommonJSBridge: NSObject <PWJavaScriptInterface>

@property (nonatomic) CDVPlugin *plugin;

@end


@implementation PWCommonJSBridge

- (void)callFunction:(NSString *)functionName :(NSString *)parameters {
    NSString *function = parameters != nil ? [NSString stringWithFormat:@"%@(%@)", functionName, parameters] : [NSString stringWithFormat:@"%@()", functionName];
    [_plugin.webViewEngine evaluateJavaScript:function completionHandler:nil];
}

@end

#if PW_VOIP_ENABLED
@interface PushNotification() <PWMessagingDelegate, UIApplicationDelegate, PWVoIPCallDelegate>
#else
@interface PushNotification() <PWMessagingDelegate, UIApplicationDelegate>
#endif

#if PW_VOIP_ENABLED
@property (nonatomic, strong) CXCallController *callController;
@property (nonatomic, strong) CXProvider *provider;
#endif
@property (nonatomic, retain) NSMutableDictionary *callbackIds;
@property (nonatomic, retain) PushNotificationManager *pushManager;
@property (nonatomic, retain) Pushwoosh *pushwoosh;
@property (nonatomic, copy) NSDictionary *startPushData;
@property (nonatomic, assign) BOOL startPushCleared;
@property (nonatomic, assign) BOOL deviceReady;

- (BOOL) application:(UIApplication *)application pwplugin_didRegisterUserNotificationSettings:(UIUserNotificationSettings *)settings;
- (void) application:(UIApplication *)application pwplugin_didRegisterWithDeviceToken:(NSData *)deviceToken;
- (void) application:(UIApplication *)application pwplugin_didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler;
- (void) application:(UIApplication *)application pwplugin_didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

@end

void pushwoosh_swizzle(Class class, SEL fromChange, SEL toChange, IMP impl, const char * signature) {
    Method method = nil;
    method = class_getInstanceMethod(class, fromChange);
    
    if (method) {
        //method exists add a new method and swap with original
        class_addMethod(class, toChange, impl, signature);
        method_exchangeImplementations(class_getInstanceMethod(class, fromChange), class_getInstanceMethod(class, toChange));
    } else {
        //just add as orignal method
        class_addMethod(class, fromChange, impl, signature);
    }
}

static PushNotification *pw_PushNotificationPlugin;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wincomplete-implementation"

@implementation PushNotification

API_AVAILABLE(ios(10))
__weak id<UNUserNotificationCenterDelegate> _originalNotificationCenterDelegate;
API_AVAILABLE(ios(10))
  struct {
    unsigned int willPresentNotification : 1;
    unsigned int didReceiveNotificationResponse : 1;
    unsigned int openSettingsForNotification : 1;
  } _originalNotificationCenterDelegateResponds;

#pragma clang diagnostic pop

- (void)pluginInitialize {
    [super pluginInitialize];
    pw_PushNotificationPlugin = self;
#if PW_VOIP_ENABLED
    callbackIds = [[NSMutableDictionary alloc] initWithCapacity:5];
    [callbackIds setObject:[NSMutableArray array] forKey:@"initializeVoIPParameters"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"answer"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"endCall"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"hangup"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"reject"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"muted"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"held"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"voipPushPayload"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"incomingCallSuccess"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"incomingCallFailure"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"speakerOn"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"speakerOff"];
    [callbackIds setObject:[NSMutableArray array] forKey:@"playDTMF"];

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(receiveCallFromRecents:) name:@"RecentsCallNotification" object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleAudioRouteChange:) name:AVAudioSessionRouteChangeNotification object:nil];
#endif
}

- (NSMutableDictionary *)callbackIds {
    if (_callbackIds == nil) {
        _callbackIds = [[NSMutableDictionary alloc] init];
    }
    return _callbackIds;
}

- (PushNotificationManager *)pushManager {
    if (_pushManager == nil) {
        _pushManager = [PushNotificationManager pushManager];
        _pushManager.delegate = self;
    }
    return _pushManager;
}

- (Pushwoosh *)pushwoosh {
    if (_pushwoosh == nil) {
        _pushwoosh = [Pushwoosh sharedInstance];
        _pushwoosh.delegate = self;
    }
    return _pushwoosh;
}

- (void)getPushToken:(CDVInvokedUrlCommand *)command {
    NSString *token = [[PushNotificationManager pushManager] getPushToken];
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:token];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getPushwooshHWID:(CDVInvokedUrlCommand *)command {
    NSString *token = [[PushNotificationManager pushManager] getHWID];
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:token];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setApiToken:(CDVInvokedUrlCommand *)command {
    NSString *token = command.arguments[0];
    [[PWSettings settings] setApiToken:token];
}

- (void)onDeviceReady:(CDVInvokedUrlCommand *)command {
    NSDictionary *options = [command.arguments firstObject];

    NSString *appid = options[@"pw_appid"];
    if (!appid) {
        appid = options[@"appid"];
    }
    
    NSString *appname = options[@"appname"];

    if (!appid) {
        //no Pushwoosh App Id provided in JS call, let's try Info.plist (SDK default)
        if (self.pushManager == nil) {
            PWLogError(@"PushNotification.registerDevice: Missing Pushwoosh App ID");
            return;
        }
    }
    else {
        [PushNotificationManager initializeWithAppCode:appid appName:appname];
    }
    
    [UNUserNotificationCenter currentNotificationCenter].delegate = [PushNotificationManager pushManager].notificationCenterDelegate;
    [self.pushManager sendAppOpen];

    NSString * alertTypeString = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"Pushwoosh_ALERT_TYPE"];
    if([alertTypeString isKindOfClass:[NSString class]] && [alertTypeString isEqualToString:@"NONE"]) {
        self.pushManager.showPushnotificationAlert = NO;
    }
    
    _deviceReady = YES;
    
    if (self.pushwoosh.launchNotification) {
        NSDictionary *notification = [self createNotificationDataForPush:self.pushwoosh.launchNotification onStart:YES];
        [self dispatchPushReceive:notification];
        [self dispatchPushAccept:notification];
    }

    [[NSUserDefaults standardUserDefaults] synchronize];
}

#pragma mark - UNUserNotificationCenter Delegate Methods
#pragma mark -

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:
(void (^)(UNNotificationPresentationOptions options))completionHandler
API_AVAILABLE(ios(10.0)) {
    
    if ([PushNotificationManager pushManager].showPushnotificationAlert) {
        completionHandler(UNNotificationPresentationOptionBadge | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionSound);
    } else if ([self isRemoteNotification:notification] && [PWMessage isPushwooshMessage:notification.request.content.userInfo]) {
        completionHandler(UNNotificationPresentationOptionNone);
    } else if ([notification.request.content.userInfo objectForKey:@"pw_push"] == nil) {
        completionHandler(UNNotificationPresentationOptionBadge | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionSound);
    } else {
        completionHandler(UNNotificationPresentationOptionNone);
    }
    
    if (_originalNotificationCenterDelegate != nil &&
        _originalNotificationCenterDelegateResponds.willPresentNotification) {
        [_originalNotificationCenterDelegate userNotificationCenter:center
                                            willPresentNotification:notification
                                              withCompletionHandler:completionHandler];
    }
}

- (BOOL)isContentAvailablePush:(NSDictionary *)userInfo {
    NSDictionary *apsDict = userInfo[@"aps"];
    return apsDict[@"content-available"] != nil;
}

- (NSDictionary *)pushPayloadFromContent:(UNNotificationContent *)content {
    return [[content.userInfo objectForKey:@"pw_push"] isKindOfClass:[NSDictionary class]] ? [content.userInfo objectForKey:@"pw_push"] : content.userInfo;
}

- (BOOL)isRemoteNotification:(UNNotification *)notification {
    return [notification.request.trigger isKindOfClass:[UNPushNotificationTrigger class]];
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
API_AVAILABLE(ios(10.0)) {
    dispatch_block_t handlePushAcceptanceBlock = ^{
        if (![response.actionIdentifier isEqualToString:UNNotificationDismissActionIdentifier]) {
            if (![response.actionIdentifier isEqualToString:UNNotificationDefaultActionIdentifier] && [[PushNotificationManager pushManager].delegate respondsToSelector:@selector(onActionIdentifierReceived:withNotification:)]) {
                [[PushNotificationManager pushManager].delegate onActionIdentifierReceived:response.actionIdentifier withNotification:[self pushPayloadFromContent:response.notification.request.content]];
            }
        }
    };
    
    if ([self isRemoteNotification:response.notification]  && [PWMessage isPushwooshMessage:response.notification.request.content.userInfo]) {
        handlePushAcceptanceBlock();
    } else if ([response.notification.request.content.userInfo objectForKey:@"pw_push"]) {
        handlePushAcceptanceBlock();
    }

    if (_originalNotificationCenterDelegate != nil &&
        _originalNotificationCenterDelegateResponds.didReceiveNotificationResponse) {
        [_originalNotificationCenterDelegate userNotificationCenter:center
                                     didReceiveNotificationResponse:response
                                              withCompletionHandler:completionHandler];
    } else {
        completionHandler();
    }
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
   openSettingsForNotification:(nullable UNNotification *)notification
API_AVAILABLE(ios(10.0)) {
    if ([[PushNotificationManager pushManager].delegate respondsToSelector:@selector(pushManager:openSettingsForNotification:)]) {
        #pragma clang diagnostic push
        #pragma clang diagnostic ignored "-Wpartial-availability"
        [[PushNotificationManager pushManager].delegate pushManager:[PushNotificationManager pushManager] openSettingsForNotification:notification];
        #pragma clang diagnostic pop
    }

    if (_originalNotificationCenterDelegate != nil &&
        _originalNotificationCenterDelegateResponds.openSettingsForNotification) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
        [_originalNotificationCenterDelegate userNotificationCenter:center
                                        openSettingsForNotification:notification];
#pragma clang diagnostic pop
    }
}

// Authorization options in addition to UNAuthorizationOptionBadge | UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionCarPlay. Should be called before registering for pushes
- (void)additionalAuthorizationOptions:(CDVInvokedUrlCommand *)command {
    NSDictionary *options = [command.arguments firstObject];
    NSString* critical = options[@"UNAuthorizationOptionCriticalAlert"];
    NSString* provisional = options[@"UNAuthorizationOptionProvisional"];
    NSString* providesSettings = options[@"UNAuthorizationOptionProvidesAppNotificationSettings"];
    
    UNAuthorizationOptions authOptions = 0;
    if (@available(iOS 12.0, *)) {
        if (critical) {
            authOptions |= UNAuthorizationOptionCriticalAlert;
        }
        if (provisional) {
            authOptions |= UNAuthorizationOptionProvisional;
        }
        if (providesSettings) {
            authOptions |= UNAuthorizationOptionProvidesAppNotificationSettings;
        }
        [Pushwoosh sharedInstance].additionalAuthorizationOptions = authOptions;
    }
}

- (void)dispatchPushReceive:(NSDictionary *)pushData {
    NSData *json = [NSJSONSerialization dataWithJSONObject:pushData options:NSJSONWritingPrettyPrinted error:nil];
    NSString *jsonString = [[NSString alloc] initWithData:json encoding:NSUTF8StringEncoding];
        
    NSString *pushReceiveJsStatement = [NSString stringWithFormat: @"cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").pushReceivedCallback(%@);", jsonString];
        
    [self.commandDelegate evalJs:WRITEJS(pushReceiveJsStatement)];
}

- (void)dispatchPushAccept:(NSDictionary *)pushData {
    NSData *json = [NSJSONSerialization dataWithJSONObject:pushData options:NSJSONWritingPrettyPrinted error:nil];
    NSString *jsonString = [[NSString alloc] initWithData:json encoding:NSUTF8StringEncoding];
    
    NSString *pushOpenJsStatement = [NSString stringWithFormat: @"cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").notificationCallback(%@);", jsonString];
    
    [self.commandDelegate evalJs:WRITEJS(pushOpenJsStatement)];
}

- (void)registerDevice:(CDVInvokedUrlCommand *)command {
    [PushNotification swizzleNotificationSettingsHandler];
    
    self.callbackIds[@"registerDevice"] = command.callbackId;

    //Cordova BUG: https://issues.apache.org/jira/browse/CB-8063
    //    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT messageAsDictionary:nil];
    //    [pluginResult setKeepCallbackAsBool:YES];
    //    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];

    [[PushNotificationManager pushManager] registerForPushNotifications];
}

- (void)unregisterDevice:(CDVInvokedUrlCommand *)command {
    self.callbackIds[@"unregisterDevice"] = command.callbackId;
    
    [[PushNotificationManager pushManager] unregisterForPushNotificationsWithCompletion:^(NSError *error) {
        if (!error) {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"unregisterDevice"]];
        } else {
            NSMutableDictionary *results = [NSMutableDictionary dictionary];
            results[@"error"] = [NSString stringWithFormat:@"%@", error];
            
            CDVPluginResult *pluginResult =
            [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:results];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"unregisterDevice"]];
        }
    }];
}

- (void)setLanguage:(CDVInvokedUrlCommand *)command {
    NSString *language = command.arguments[0];
    [[Pushwoosh sharedInstance] setLanguage:language];
}

- (void)setShowPushnotificationAlert:(CDVInvokedUrlCommand *)command {
    id showPushnotificationAlert = command.arguments[0];
    self.pushManager.showPushnotificationAlert = [showPushnotificationAlert boolValue];
}

- (void)startBeaconPushes:(CDVInvokedUrlCommand *)command {
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:@{ @"error" : @"Beacon tracking is not supported" }];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)stopBeaconPushes:(CDVInvokedUrlCommand *)command {
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:@{ @"error" : @"Beacon tracking is not supported" }];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setTags:(CDVInvokedUrlCommand *)command {
    [[PushNotificationManager pushManager] setTags:command.arguments[0]];

    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getTags:(CDVInvokedUrlCommand *)command {
    // The first argument in the arguments parameter is the callbackID.
    self.callbackIds[@"getTags"] = command.callbackId;

    //Cordova BUG: https://issues.apache.org/jira/browse/CB-8063
    //    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT messageAsDictionary:nil];
    //    [pluginResult setKeepCallbackAsBool:YES];
    //    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];

    [[PushNotificationManager pushManager] loadTags:^(NSDictionary *tags) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:tags];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"getTags"]];
    } error:^(NSError *error) {
        NSMutableDictionary *results = [NSMutableDictionary dictionary];
        results[@"error"] = [NSString stringWithFormat:@"%@", error];

        CDVPluginResult *pluginResult =
            [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:results];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"getTags"]];
    }];
}

- (void)loadMessages:(CDVInvokedUrlCommand *)command {
    // The first argument in the arguments parameter is the callbackID.
    self.callbackIds[@"loadMessages"] = command.callbackId;
    [PWInbox loadMessagesWithCompletion:^(NSArray<NSObject<PWInboxMessageProtocol> *> *messages, NSError *error) {
        if (!error) {
            NSMutableArray* array = [[NSMutableArray alloc] init];
            for (NSObject<PWInboxMessageProtocol>* message in messages) {
                NSDictionary* dict = [self inboxMessageToDictionary:message];
                [array addObject:dict];
            }
            
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:array];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"loadMessages"]];
        } else {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.localizedDescription];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"loadMessages"]];
        }
    }];
}

- (void)unreadMessagesCount:(CDVInvokedUrlCommand *)command {
    // The first argument in the arguments parameter is the callbackID.
    self.callbackIds[@"unreadMessagesCount"] = command.callbackId;
    [PWInbox unreadMessagesCountWithCompletion:^(NSInteger count, NSError *error) {
        if (!error) {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:(int)count];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"unreadMessagesCount"]];
        }
    }];
}

- (void)messagesWithNoActionPerformedCount:(CDVInvokedUrlCommand *)command {
    // The first argument in the arguments parameter is the callbackID.
    self.callbackIds[@"messagesWithNoActionPerformedCount"] = command.callbackId;
    [PWInbox messagesWithNoActionPerformedCountWithCompletion:^(NSInteger count, NSError *error) {
        if (!error) {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:(int)count];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"messagesWithNoActionPerformedCount"]];
        }
    }];
}

- (void)messagesCount:(CDVInvokedUrlCommand *)command {
    // The first argument in the arguments parameter is the callbackID.
    self.callbackIds[@"messagesCount"] = command.callbackId;
    [PWInbox messagesCountWithCompletion:^(NSInteger count, NSError *error) {
        if (!error) {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:(int)count];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"messagesCount"]];
        }
    }];
}

- (void)readMessage:(CDVInvokedUrlCommand *)command {
    NSString *messageCode = command.arguments[0];
    if (messageCode.length != 0) {
        NSArray *array = [NSArray arrayWithObject:messageCode];
        [PWInbox readMessagesWithCodes:array];
    }
}

- (void)deleteMessage:(CDVInvokedUrlCommand *)command {
    NSString *messageCode = command.arguments[0];
    if (messageCode.length != 0) {
        NSArray *array = [NSArray arrayWithObject:messageCode];
        [PWInbox deleteMessagesWithCodes:array];
    }
}

- (void)performAction:(CDVInvokedUrlCommand *)command {
    NSString *messageCode = command.arguments[0];
    if (messageCode.length != 0) {
        [PWInbox performActionForMessageWithCode:messageCode];
    }
}


- (void)createLocalNotification:(CDVInvokedUrlCommand *)command {
    NSDictionary *params = command.arguments[0];
    NSString *body = params[@"msg"];
    NSUInteger delay = [params[@"seconds"] unsignedIntegerValue];
    NSDictionary *userData = params[@"userData"];
    
    [self sendLocalNotificationWithBody:body delay:delay userData:userData];
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)sendLocalNotificationWithBody:(NSString *)body delay:(NSUInteger)delay userData:(NSDictionary *)userData {
    if (@available(iOS 10, *)) {
        UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
        UNMutableNotificationContent *content = [UNMutableNotificationContent new];
        content.body = body;
        content.sound = [UNNotificationSound defaultSound];
        content.userInfo = userData;
        UNTimeIntervalNotificationTrigger *trigger = [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:delay repeats:NO];
        NSString *identifier = @"LocalNotification";
        UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:identifier
                                                                              content:content
                                                                              trigger:trigger];
        
        [center addNotificationRequest:request withCompletionHandler:^(NSError *_Nullable error) {
            if (error != nil) {
                NSLog(@"Something went wrong: %@", error);
            }
        }];
    } else {
        UILocalNotification *localNotification = [[UILocalNotification alloc] init];
        localNotification.fireDate = [NSDate dateWithTimeIntervalSinceNow:delay];
        localNotification.alertBody = body;
        localNotification.timeZone = [NSTimeZone defaultTimeZone];
        localNotification.userInfo = userData;
        [[UIApplication sharedApplication] scheduleLocalNotification:localNotification];
    }
}

- (void)onDidRegisterForRemoteNotificationsWithDeviceToken:(NSString *)token {
    if (self.callbackIds[@"registerDevice"]) {
        NSMutableDictionary *results = [PushNotificationManager getRemoteNotificationStatus];
        results[@"pushToken"] = token;
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"registerDevice"]];
    }
}

- (void)onDidFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
    if (self.callbackIds[@"registerDevice"]) {
        NSMutableDictionary *results = [NSMutableDictionary dictionary];
        results[@"error"] = [NSString stringWithFormat:@"%@", error];
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:results];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"registerDevice"]];
    }
}

- (NSDictionary *)createNotificationDataForPush:(NSDictionary *)pushNotification onStart:(BOOL)onStart {
    if (!onStart && !_deviceReady) {
        PWLogWarn(@"PUSHWOOSH WARNING: onStart is false, but onDeviceReady has not been called. Did you "
                  @"forget to call onDeviceReady?");
    }
    
    NSMutableDictionary *notification = [NSMutableDictionary new];
    
    notification[@"onStart"] = @(onStart);
    
    BOOL isForegound = [UIApplication sharedApplication].applicationState == UIApplicationStateActive;
    notification[@"foreground"] = @(isForegound);
    
    id alert = pushNotification[@"aps"][@"alert"];
    NSString *message = alert;
    if ([alert isKindOfClass:[NSDictionary class]]) {
        message = alert[@"body"];
    }
    
    if (message) {
        notification[@"message"] = message;
    }
    
    NSDictionary *userdata = [[PushNotificationManager pushManager] getCustomPushDataAsNSDict:pushNotification];
    if (userdata) {
        notification[@"userdata"] = userdata;
    }
    
    notification[@"ios"] = pushNotification;
    
    PWLogDebug(@"Notification opened: %@", notification);
    
    if (onStart) {
        //keep the start push
        self.startPushData = notification;
        self.startPushCleared = NO;
    }
    
    return notification;
}

- (void)onPushReceived:(PushNotificationManager *)pushManager withNotification:(NSDictionary *)pushNotification onStart:(BOOL)onStart {
    if (_deviceReady) {
        NSDictionary *notification = [self createNotificationDataForPush:pushNotification onStart:onStart];
        //send it to the webview
        [self dispatchPushReceive:notification];
    }
}

- (void)onPushAccepted:(PushNotificationManager *)manager withNotification:(NSDictionary *)pushNotification onStart:(BOOL)onStart {
    if (_deviceReady) {
        NSDictionary *notification = [self createNotificationDataForPush:pushNotification onStart:onStart];
        //send it to the webview
        [self dispatchPushAccept:notification];
    }
}

#if PW_VOIP_ENABLED
// MARK: - Voip settings
- (void)requestCallPermission:(CDVInvokedUrlCommand *)command {
    //stub, android only
}

- (void)setVoipAppCode:(CDVInvokedUrlCommand *)command {
    NSString *voipAppCode = command.arguments[0];
    [PushwooshVoIPImplementation setPushwooshVoIPAppId:voipAppCode];
}

// MARK: - VoIP, CallKit callbacks
- (void)receiveCallFromRecents:(NSNotification *) notification {
    NSString* callID = notification.object[@"callId"];
    NSString* callName = notification.object[@"callName"];
    NSUUID *callUUID = [[NSUUID alloc] init];
    CXHandle *handle = [[CXHandle alloc] initWithType:CXHandleTypePhoneNumber value:callID];
    CXStartCallAction *startCallAction = [[CXStartCallAction alloc] initWithCallUUID:callUUID handle:handle];
    startCallAction.video = [notification.object[@"isVideo"] boolValue] ? YES : NO;
    startCallAction.contactIdentifier = callName;
    CXTransaction *transaction = [[CXTransaction alloc] initWithAction:startCallAction];
    [self.callController requestTransaction:transaction completion:^(NSError * _Nullable error) {
        if (error == nil) {
        } else {
            NSLog(@"%@",[error localizedDescription]);
        }
    }];
}

- (void)handleAudioRouteChange:(NSNotification *) notification {
    if(monitorAudioRouteChange) {
        NSNumber* reasonValue = notification.userInfo[@"AVAudioSessionRouteChangeReasonKey"];
        AVAudioSessionRouteDescription* previousRouteKey = notification.userInfo[@"AVAudioSessionRouteChangePreviousRouteKey"];
        NSArray* outputs = [previousRouteKey outputs];
        if([outputs count] > 0) {
            AVAudioSessionPortDescription *output = outputs[0];
            if(![output.portType isEqual: @"Speaker"] && [reasonValue isEqual:@4]) {
                for (id callbackId in callbackIds[@"speakerOn"]) {
                    CDVPluginResult* pluginResult = nil;
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"speakerOn event called successfully"];
                    [pluginResult setKeepCallbackAsBool:YES];
                    [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
                }
            } else if([output.portType isEqual: @"Speaker"] && [reasonValue isEqual:@3]) {
                for (id callbackId in callbackIds[@"speakerOff"]) {
                    CDVPluginResult* pluginResult = nil;
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"speakerOff event called successfully"];
                    [pluginResult setKeepCallbackAsBool:YES];
                    [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
                }
            }
        }
    }
}

- (void)returnedCallController:(CXCallController *)controller {
    self.callController = controller;
}

- (void)returnedProvider:(CXProvider *)provider {
    self.provider = provider;
}

// MARK: - Initialize CallKit Parameters
- (void)initializeVoIPParameters:(CDVInvokedUrlCommand *)command {
    CDVPluginResult* pluginResult = nil;

    NSNumber *supportsVideoNumber = [command.arguments objectAtIndex:0];
    NSString *ringtoneSound = [command.arguments objectAtIndex:1];
    NSNumber *handleTypesNumber = [command.arguments objectAtIndex:2];

    if ([supportsVideoNumber isKindOfClass:[NSNumber class]] &&
        [ringtoneSound isKindOfClass:[NSString class]] && ringtoneSound.length > 0 &&
        [handleTypesNumber isKindOfClass:[NSNumber class]]) {
        
        BOOL supportsVideo = [supportsVideoNumber boolValue];
        NSInteger handleTypes = [handleTypesNumber integerValue];

        PushwooshVoIPImplementation.delegate = self;
        [PushwooshVoIPImplementation initializeVoIP:supportsVideo
                                       ringtoneSound:ringtoneSound
                                          handleTypes:handleTypes];

        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"VoIP Parameters Initialized"];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Invalid Parameters"];
    }

    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

// MARK: - Incoming Call Payload
- (void)voipDidReceiveIncomingCallWithPayload:(PWVoIPMessage *)payload {
    for (id callbackId in callbackIds[@"voipPushPayload"]) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self handleVoIPMessage:payload]];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
}

// MARK: - Incoming Call Success
- (void)voipDidReportIncomingCallSuccessfullyWithVoipMessage:(PWVoIPMessage *)voipMessage {
    for (id callbackId in callbackIds[@"incomingCallSuccess"]) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self handleVoIPMessage:voipMessage]];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
}

// MARK: - Incoming Call Failure
- (void)voipDidFailToReportIncomingCallWithError:(NSError *)error {
    for (id callbackId in callbackIds[@"incomingCallFailure"]) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:[NSString stringWithFormat:@"Error incoming call: %@", error.localizedDescription]];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
}

- (void)pwProviderDidBegin:(CXProvider *)provider {}

- (void)pwProviderDidReset:(CXProvider *)provider {}

// MARK: - Register event func
- (void)registerEvent:(CDVInvokedUrlCommand*)command {
    NSString* eventName = [command.arguments objectAtIndex:0];
    if(callbackIds[eventName] != nil) {
        [callbackIds[eventName] addObject:command.callbackId];
    }
    
    if (pendingCallFromRecents && [eventName isEqual:@"sendCall"]) {
        NSDictionary *callData = pendingCallFromRecents;
        CDVPluginResult* pluginResult = nil;
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:callData];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
}

// MARK: - Send Call
- (void)sendCall:(CDVInvokedUrlCommand*)command {
    BOOL hasId = ![[command.arguments objectAtIndex:1] isEqual:[NSNull null]];
    NSString* callName = [command.arguments objectAtIndex:0];
    NSString* callId = hasId?[command.arguments objectAtIndex:1]:callName;
    NSUUID *callUUID = [[NSUUID alloc] init];

    if (callName != nil && [callName length] > 0) {
        CXHandle *handle = [[CXHandle alloc] initWithType:CXHandleTypePhoneNumber value:callId];
        CXStartCallAction *startCallAction = [[CXStartCallAction alloc] initWithCallUUID:callUUID handle:handle];
        startCallAction.contactIdentifier = callName;
        startCallAction.video = YES;
        CXTransaction *transaction = [[CXTransaction alloc] initWithAction:startCallAction];
        [self.callController requestTransaction:transaction completion:^(NSError * _Nullable error) {
            if (error == nil) {
                [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Outgoing call successful"] callbackId:command.callbackId];
            } else {
                [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[error localizedDescription]] callbackId:command.callbackId];
            }
        }];
    } else {
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"The caller id can't be empty"] callbackId:command.callbackId];
    }
}

// MARK: - Connect Call
- (void)connectCall:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = nil;
    NSArray<CXCall *> *calls = self.callController.callObserver.calls;

    if([calls count] == 1) {
        [self.provider reportOutgoingCallWithUUID:calls[0].UUID connectedAtDate:nil];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Call connected successfully"];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"No call exists for you to connect"];
    }

    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

// MARK: - End Call
- (void)endCall:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = nil;
    NSArray<CXCall *> *calls = self.callController.callObserver.calls;

    if([calls count] == 1) {
        CXEndCallAction *endCallAction = [[CXEndCallAction alloc] initWithCallUUID:calls[0].UUID];
        CXTransaction *transaction = [[CXTransaction alloc] initWithAction:endCallAction];
        [self.callController requestTransaction:transaction completion:^(NSError * _Nullable error) {
            if (error == nil) {
            } else {
                NSLog(@"%@",[error localizedDescription]);
            }
        }];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Call ended successfully"];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"No call exists for you to connect"];
    }

    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

// MARK: - Start Outgoing Call
- (void)startCall:(CXProvider *)provider perform:(CXStartCallAction *)action {
    [self setupAudioSession];
    CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
    callUpdate.remoteHandle = action.handle;
    callUpdate.hasVideo = action.video;
    callUpdate.localizedCallerName = action.contactIdentifier;
    callUpdate.supportsGrouping = NO;
    callUpdate.supportsUngrouping = NO;
    callUpdate.supportsHolding = NO;
    
    [self.provider reportCallWithUUID:action.callUUID updated:callUpdate];
    [action fulfill];
    NSDictionary *callData = @{@"callName":action.contactIdentifier,
                               @"callId": action.handle.value,
                               @"isVideo": action.video ? @YES : @NO,
                               @"message": @"sendCall event called successfully"};
    for (id callbackId in callbackIds[@"sendCall"]) {
        CDVPluginResult* pluginResult = nil;
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:callData];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
    
    if ([callbackIds[@"sendCall"] count] == 0) {
        pendingCallFromRecents = callData;
    }
}

// MARK: - Answer Call
- (void)answerCall:(CXProvider *)provider perform:(CXAnswerCallAction *)action voipMessage:(PWVoIPMessage *)voipMessage {
    [self setupAudioSession];
    [action fulfill];
        
    for (id callbackId in callbackIds[@"answer"]) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self handleVoIPMessage:voipMessage]];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
}

// MARK: - End Call
- (void)endCall:(CXProvider *)provider perform:(CXEndCallAction *)action voipMessage:(PWVoIPMessage *)voipMessage {
    NSArray<CXCall *> *calls = self.callController.callObserver.calls;
    if([calls count] == 1) {
        if(calls[0].hasConnected) {
            for (id callbackId in callbackIds[@"hangup"]) {
                CDVPluginResult* pluginResult = nil;
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self handleVoIPMessage:voipMessage]];
                [pluginResult setKeepCallbackAsBool:YES];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
            }
        } else {
            for (id callbackId in callbackIds[@"reject"]) {
                CDVPluginResult* pluginResult = nil;
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self handleVoIPMessage:voipMessage]];
                [pluginResult setKeepCallbackAsBool:YES];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
            }
        }
    }
    monitorAudioRouteChange = NO;
    [action fulfill];
}

// MARK: - Muted Call
- (void)mutedCall:(CXProvider *)provider perform:(CXSetMutedCallAction *)action {
    BOOL isMuted = action.muted;
    for (id callbackId in callbackIds[@"muted"]) {
        CDVPluginResult* pluginResult = nil;
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:isMuted ? @"true" : @"false"];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
    [action fulfill];
}

// MARK: - Audio Session Activate (Inner)
- (void)activatedAudioSession:(CXProvider *)provider didActivate:(AVAudioSession *)audioSession {
    monitorAudioRouteChange = YES;
}

// MARK: - Audio Session Deactivate (Inner)
- (void)deactivatedAudioSession:(CXProvider *)provider didDeactivate:(AVAudioSession *)audioSession {
    NSLog(@"Audio session deactivated");
}

// MARK: - On Hold Call
- (void)heldCall:(CXProvider *)provider perform:(CXSetHeldCallAction *)action {
    BOOL isOnHold = action.isOnHold;
    for (id callbackId in callbackIds[@"held"]) {
        CDVPluginResult* pluginResult = nil;
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:isOnHold ? @"true" : @"false"];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
    
    [action fulfill];
}

// MARK: - Play DTMF
- (void)playDTMF:(CXProvider *)provider perform:(CXPlayDTMFCallAction *)action {
    NSString *digits = action.digits;
    [action fulfill];
    
    for (id callbackId in callbackIds[@"playDTMF"]) {
        CDVPluginResult* pluginResult = nil;
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:digits];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
}

- (void)setupAudioSession {
    AVAudioSession *sessionInstance = [AVAudioSession sharedInstance];
    NSError *error = nil;

    if (![sessionInstance setCategory:AVAudioSessionCategoryPlayAndRecord error:&error]) {
        NSLog(@"Error setting category: %@", error.localizedDescription);
        return;
    }

    if (![sessionInstance setMode:AVAudioSessionModeVoiceChat error:&error]) {
        NSLog(@"Error setting mode: %@", error.localizedDescription);
        return;
    }

    NSTimeInterval bufferDuration = 0.005;
    if (![sessionInstance setPreferredIOBufferDuration:bufferDuration error:&error]) {
        NSLog(@"Error setting buffer duration: %@", error.localizedDescription);
        return;
    }

    if (![sessionInstance setPreferredSampleRate:44100 error:&error]) {
        NSLog(@"Error setting sample rate: %@", error.localizedDescription);
        return;
    }

    NSLog(@"Audio session configured successfully");
}

- (NSDictionary *)handleVoIPMessage:(PWVoIPMessage *)voipMessage {
    if (!voipMessage) return @{};
    NSMutableDictionary *payload = [[NSMutableDictionary alloc] init];
    [payload addEntriesFromDictionary:@{@"rawPayload": voipMessage.rawPayload}];
    [payload addEntriesFromDictionary:@{@"uuid": voipMessage.uuid}];
    [payload addEntriesFromDictionary:@{@"callerName": voipMessage.callerName}];
    [payload addEntriesFromDictionary:@{@"handleType": @(voipMessage.handleType)}];
    [payload addEntriesFromDictionary:@{@"hasVideo": @(voipMessage.hasVideo)}];
    return payload;
}
#endif

- (void)getRemoteNotificationStatus:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *results = [PushNotificationManager getRemoteNotificationStatus];

    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setApplicationIconBadgeNumber:(CDVInvokedUrlCommand *)command {
    int badge = [command.arguments[0][@"badge"] intValue];
    [[UIApplication sharedApplication] setApplicationIconBadgeNumber:badge];

    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getApplicationIconBadgeNumber:(CDVInvokedUrlCommand *)command {
    NSInteger badge = [UIApplication sharedApplication].applicationIconBadgeNumber;
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:(int)badge];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)addToApplicationIconBadgeNumber:(CDVInvokedUrlCommand *)command {
    int badge = [command.arguments[0][@"badge"] intValue];
    [UIApplication sharedApplication].applicationIconBadgeNumber += badge;

    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)cancelAllLocalNotifications:(CDVInvokedUrlCommand *)command {
    [UIApplication sharedApplication].scheduledLocalNotifications = @[];

    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getLaunchNotification:(CDVInvokedUrlCommand *)command {
    NSDictionary *startPush = self.startPushCleared ? nil : self.startPushData;
    CDVPluginResult *pluginResult =
        [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:startPush];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)clearLaunchNotification:(CDVInvokedUrlCommand *)command {
    self.startPushCleared = YES;
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setUserId:(CDVInvokedUrlCommand *)command {
    NSString *userId = command.arguments[0];
    [[PWInAppManager sharedManager] setUserId:userId];
}

- (void) postEvent:(CDVInvokedUrlCommand *)command {
    NSString *event = command.arguments[0];
    NSDictionary *attributes = command.arguments[1];
    [[PWInAppManager sharedManager] postEvent:event withAttributes:attributes];
}

- (void)addJavaScriptInterface:(CDVInvokedUrlCommand *)command {
    NSString *name = command.arguments[0];
    PWCommonJSBridge *bridge = [PWCommonJSBridge new];
    bridge.plugin = self;
    [[PWInAppManager sharedManager] addJavascriptInterface:bridge withName:name];
}

- (void)setCommunicationEnabled:(CDVInvokedUrlCommand *)command {
    self.callbackIds[@"setCommunicationEnabled"] = command.callbackId;
    
    NSNumber *enabledObject = [command.arguments firstObject];
    
    BOOL enabled = [enabledObject boolValue];
    
    [[PWGDPRManager sharedManager] setCommunicationEnabled:enabled completion:^(NSError *error) {
        if (!error) {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"setCommunicationEnabled"]];
        } else {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.localizedDescription];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"setCommunicationEnabled"]];
        }
    }];
}

- (void)setEmail:(CDVInvokedUrlCommand *)command {
    NSString *email = command.arguments[0];
    [[Pushwoosh sharedInstance] setEmail:email completion:^(NSError *error) {
        CDVPluginResult *pluginResult;
        if (!error) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        } else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Failed to set email"];
        }
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)setEmails:(CDVInvokedUrlCommand *)command {
    NSArray *emailsArray = command.arguments[0];
    for (NSString *email in emailsArray) {
        [[Pushwoosh sharedInstance] setEmail:email completion:^(NSError *error) {
            CDVPluginResult *pluginResult;
            if (!error) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            } else {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Failed to set emails"];
            }
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }];
    }
}

- (void)setUserEmails:(CDVInvokedUrlCommand *)command {
    NSString *userId = command.arguments[0];
    NSArray *emailsArray = command.arguments[1];
    for (NSString *email in emailsArray) {
        [[Pushwoosh sharedInstance] setUser:userId emails:@[email] completion:^(NSError *error) {
            CDVPluginResult *pluginResult;
            if (!error) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            } else {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Failed to set user emails"];
            }
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }];
    }
}

- (void)registerSMSNumber:(CDVInvokedUrlCommand *)command {
    NSString *phoneNumber = command.arguments[0];
    [[Pushwoosh sharedInstance] registerSmsNumber:phoneNumber];
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)registerWhatsappNumber:(CDVInvokedUrlCommand *)command {
    NSString *phoneNumber = command.arguments[0];
    [[Pushwoosh sharedInstance] registerWhatsappNumber:phoneNumber];
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)isCommunicationEnabled:(CDVInvokedUrlCommand *)command {
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:[[PWGDPRManager sharedManager] isCommunicationEnabled]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)enableHuaweiPushNotifications:(CDVInvokedUrlCommand *)command {
    // Stub
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (UIImage *)imageFromInboxStyleDict:(NSDictionary *)dict forKey:(NSString *)key {
    NSObject *object = dict[key];
    if (object != nil && [object isKindOfClass:[NSString class]]) {
        return [UIImage imageWithContentsOfFile:[self.commandDelegate pathForResource:(NSString *)object]];
    }
    return nil;
}

- (UIColor *)colorFromInboxStyleDict:(NSDictionary *)dict forKey:(NSString *)key {
    NSObject *object = dict[key];
    if (object != nil && [object isKindOfClass:[NSString class]]) {
        return [PWBackward colorFromColorString:(NSString *)object cordovaViewController:((CDVViewController *)self.viewController)];
    }
    return nil;
}

- (NSString *)stringFromInboxStyleDict:(NSDictionary *)dict forKey:(NSString *)key {
    NSObject *object = dict[key];
    if (object != nil && [object isKindOfClass:[NSString class]]) {
        return (NSString *)object;
    }
    return nil;
}

- (NSString *(^)(NSDate *date, NSObject *owner))dateFormatterBlockFromInboxStyleDict:(NSDictionary *)dict forKey:(NSString *)key {
    NSObject *object = dict[key];
    if (object != nil && [object isKindOfClass:[NSString class]]) {
        NSDateFormatter *formatter = [NSDateFormatter new];
        formatter.dateFormat = (NSString*)object;
        return ^NSString *(NSDate *date, NSObject *owner) {
            return [formatter stringFromDate:date];
        };
    }
    return nil;
}

- (PWIInboxStyle *)inboxStyleForDictionary:(NSDictionary *)styleDictionary {
    PWIInboxStyle *style = [PWIInboxStyle defaultStyle];
    
    if (![self.viewController isKindOfClass:[CDVViewController class]] || ![styleDictionary isKindOfClass:[NSDictionary class]]) {
        return style;
    }
    
#define styleValue(prop, key, type) { id val = [self type##FromInboxStyleDict:styleDictionary forKey:key]; if (val != nil) prop = val; }
    
    styleValue(style.defaultImageIcon, @"defaultImageIcon", image);
    styleValue(style.dateFormatterBlock, @"dateFormat", dateFormatterBlock);
    styleValue(style.listErrorMessage, @"listErrorMessage", string);
    styleValue(style.listEmptyMessage, @"listEmptyMessage", string);
    styleValue(style.accentColor, @"accentColor", color);
    styleValue(style.defaultTextColor, @"defaultTextColor", color);
    styleValue(style.backgroundColor, @"backgroundColor", color);
    styleValue(style.selectionColor, @"highlightColor", color);
    styleValue(style.titleColor, @"titleColor", color);
    styleValue(style.descriptionColor, @"descriptionColor", color);
    styleValue(style.dateColor, @"dateColor", color);
    styleValue(style.separatorColor, @"dividerColor", color);
    
    styleValue(style.listErrorImage, @"listErrorImage", image);
    styleValue(style.listEmptyImage, @"listEmptyImage", image);
    styleValue(style.unreadImage, @"unreadImage", image);
    
    styleValue(style.barTextColor, @"barTextColor", color);
    styleValue(style.barAccentColor, @"barAccentColor", color);
    styleValue(style.barBackgroundColor, @"barBackgroundColor", color);
    styleValue(style.barTitle, @"barTitle", string);
#undef styleValue
    
    return style;
}

- (void)presentInboxUI:(CDVInvokedUrlCommand *)command {
    NSDictionary *styleDictionary = [command.arguments firstObject];
    UIViewController *inboxViewController = [PWIInboxUI createInboxControllerWithStyle:[self inboxStyleForDictionary:styleDictionary]];
    inboxViewController.navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:NSLocalizedString(@"Close", @"Close") style:UIBarButtonItemStylePlain target:self action:@selector(closeInbox)];
    [self.viewController presentViewController:[[UINavigationController alloc] initWithRootViewController:inboxViewController] animated:YES completion:nil];
}

- (void)closeInbox {
    if ([self.viewController.presentedViewController isKindOfClass:[UINavigationController class]] && [((UINavigationController*)self.viewController.presentedViewController).viewControllers.firstObject isKindOfClass:[PWIInboxViewController class]]) {
        [self.viewController dismissViewControllerAnimated:YES completion:nil];
    }
}

void pwplugin_didReceiveRemoteNotification(id self, SEL _cmd, UIApplication * application, NSDictionary * userInfo, void (^completionHandler)(UIBackgroundFetchResult)) {
    if ([self respondsToSelector:@selector(application:pwplugin_didReceiveRemoteNotification:fetchCompletionHandler:)]) {
        [self application:application pwplugin_didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
    }
    
    [[Pushwoosh sharedInstance] handlePushReceived:userInfo];
}

void pwplugin_didRegisterWithDeviceToken(id self, SEL _cmd, id application, NSData *deviceToken) {
    if ([self respondsToSelector:@selector(application: pwplugin_didRegisterWithDeviceToken:)]) {
        [self application:application pwplugin_didRegisterWithDeviceToken:deviceToken];
    }
    
    [[Pushwoosh sharedInstance] handlePushRegistration:deviceToken];
}

void pwplugin_didFailToRegisterForRemoteNotificationsWithError(id self, SEL _cmd, UIApplication *application, NSError *error) {
    if ([self respondsToSelector:@selector(application:pwplugin_didFailToRegisterForRemoteNotificationsWithError:)]) {
        [self application:application pwplugin_didFailToRegisterForRemoteNotificationsWithError:error];
    }
    
    [[Pushwoosh sharedInstance] handlePushRegistrationFailure:error];
}

BOOL pwplugin_didRegisterUserNotificationSettings(id self, SEL _cmd, id application, id notificationSettings) {
    PushNotification *pushHandler = pw_PushNotificationPlugin;
    
    UIUserNotificationSettings *settings = notificationSettings;
    
    BOOL backgroundPush = NO;
    NSArray * backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
    for(NSString *mode in backgroundModes) {
        if([mode isEqualToString:@"remote-notification"]) {
            backgroundPush = YES;
            break;
        }
    }
    
    if (settings.types == UIUserNotificationTypeNone && !backgroundPush) {
        NSMutableDictionary *results = [NSMutableDictionary dictionary];
        results[@"error"] = [NSString stringWithFormat:@"Push Notifications are disabled by user"];
        
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:results];
        [pushHandler.commandDelegate sendPluginResult:pluginResult callbackId:pushHandler.callbackIds[@"registerDevice"]];
    }
    
    if([self respondsToSelector:@selector(application: pwplugin_didRegisterUserNotificationSettings:)]) {
        [self application:application pwplugin_didRegisterUserNotificationSettings:notificationSettings];
    }
    
    return YES;
}

+ (void) swizzleNotificationSettingsHandler {
    if ([UIApplication sharedApplication].delegate == nil) {
        return;
    }
    
    if ([[[UIDevice currentDevice] systemVersion] floatValue] < 8.0) {
        return;
    }
    
    static Class appDelegateClass = nil;
    
    //do not swizzle the same class twice
    id delegate = [UIApplication sharedApplication].delegate;
    if(appDelegateClass == [delegate class]) {
        return;
    }
    
    appDelegateClass = [delegate class];
    
    pushwoosh_swizzle([delegate class], @selector(application:didRegisterUserNotificationSettings:), @selector(application:pwplugin_didRegisterUserNotificationSettings:), (IMP)pwplugin_didRegisterUserNotificationSettings, "v@:::");
    pushwoosh_swizzle([delegate class], @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:), @selector(application:pwplugin_didRegisterWithDeviceToken:), (IMP)pwplugin_didRegisterWithDeviceToken, "v@:::");
    pushwoosh_swizzle([delegate class], @selector(application:didFailToRegisterForRemoteNotificationsWithError:), @selector(application:pwplugin_didFailToRegisterForRemoteNotificationsWithError:), (IMP)pwplugin_didFailToRegisterForRemoteNotificationsWithError, "v@:::");
    pushwoosh_swizzle([delegate class], @selector(application:didReceiveRemoteNotification:fetchCompletionHandler:), @selector(application:pwplugin_didReceiveRemoteNotification:fetchCompletionHandler:), (IMP)pwplugin_didReceiveRemoteNotification, "v@::::");
}

- (NSDictionary*)inboxMessageToDictionary:(NSObject<PWInboxMessageProtocol>*) message {
    NSMutableDictionary* dictionary = [[NSMutableDictionary alloc] init];
    [dictionary setValue:@(message.type) forKey:@"type"];
    [dictionary setValue:[self stringOrEmpty: message.imageUrl] forKey:@"imageUrl"];
    [dictionary setValue:[self stringOrEmpty: message.code] forKey:@"code"];
    [dictionary setValue:[self stringOrEmpty: message.title] forKey:@"title"];
    [dictionary setValue:[self stringOrEmpty: message.message] forKey:@"message"];
    [dictionary setValue:[self stringOrEmpty: [self dateToString:message.sendDate]] forKey:@"sendDate"];
    [dictionary setValue:@(message.isRead) forKey:@"isRead"];
    [dictionary setValue:@(message.isActionPerformed) forKey:@"isActionPerformed"];
    
    NSDictionary* actionParams = [NSDictionary dictionaryWithDictionary:message.actionParams];
    NSData* customData = [actionParams valueForKey:@"u"];
    [dictionary setValue:customData forKey:@"customData"];
    
    NSDictionary* result = [NSDictionary dictionaryWithDictionary:dictionary];
    return result;
}

- (NSString *)stringOrEmpty:(NSString *)string {
    return string != nil ? string : @"";
}

- (NSString*)dateToString:(NSDate*)date {
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"yyyy-MM-dd'T'H:mm:ssZ"];
    return [formatter stringFromDate:date];
}

- (void)dealloc {
    self.pushManager = nil;
    self.startPushData = nil;
}

@end

@implementation UIApplication (InternalPushRuntime)

- (BOOL)pushwooshUseRuntimeMagic {
    return YES;
}

@end
