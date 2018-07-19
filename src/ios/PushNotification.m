//
//  PushNotification.m
//
// Based on the Push Notifications Cordova Plugin by Olivier Louvignes on 06/05/12.
// Modified by Max Konev on 18/05/12.
//
// Pushwoosh Push Notifications Plugin for Cordova iOS
// www.pushwoosh.com
// (c) Pushwoosh 2012
//
// MIT Licensed

#import "PushNotification.h"
#import "PWLog.h"
#import "PushwooshInboxUI.h"
#import "PWGDPRManager.h"
#import "PWInAppManager.h"

#import "AppDelegate.h"

#import <CoreLocation/CoreLocation.h>
#import <UserNotifications/UserNotifications.h>

#import <objc/runtime.h>


#define WRITEJS(VAL) [NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", VAL]


@interface PWCommonJSBridge: NSObject <PWJavaScriptInterface>

@property (nonatomic) CDVPlugin *plugin;

@end


@implementation PWCommonJSBridge

- (void)callFunction:(NSString *)functionName :(NSString *)parameters {
    NSString *function = parameters != nil ? [NSString stringWithFormat:@"%@(%@)", functionName, parameters] : [NSString stringWithFormat:@"%@()", functionName];
    [_plugin.webViewEngine evaluateJavaScript:function completionHandler:nil];
}

@end


@interface PushNotification()

@property (nonatomic, retain) NSMutableDictionary *callbackIds;
@property (nonatomic, retain) PushNotificationManager *pushManager;
@property (nonatomic, copy) NSDictionary *startPushData;
@property (nonatomic, assign) BOOL startPushCleared;
@property (nonatomic, assign) BOOL deviceReady;

- (BOOL) application:(UIApplication *)application pwplugin_didRegisterUserNotificationSettings:(UIUserNotificationSettings *)settings;

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

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wincomplete-implementation"

@implementation PushNotification

#pragma clang diagnostic pop

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
	
	if (self.pushManager.launchNotification) {
        NSDictionary *notification = [self createNotificationDataForPush:self.pushManager.launchNotification onStart:YES];
        [self dispatchPushReceive:notification];
        [self dispatchPushAccept:notification];
	}

	[[NSUserDefaults standardUserDefaults] synchronize];
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
	//	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT messageAsDictionary:nil];
	//	[pluginResult setKeepCallbackAsBool:YES];
	//	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];

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
	//	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT messageAsDictionary:nil];
	//	[pluginResult setKeepCallbackAsBool:YES];
	//	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];

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

- (void)sendLocation:(CDVInvokedUrlCommand *)command {
	NSNumber *lat = command.arguments[0][@"lat"];
	NSNumber *lon = command.arguments[0][@"lon"];
	CLLocation *location = [[CLLocation alloc] initWithLatitude:[lat doubleValue] longitude:[lon doubleValue]];
	[[PushNotificationManager pushManager] sendLocation:location];

	CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)startLocationTracking:(CDVInvokedUrlCommand *)command {
	[[PushNotificationManager pushManager] startLocationTracking];

	CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)stopLocationTracking:(CDVInvokedUrlCommand *)command {
	[[PushNotificationManager pushManager] stopLocationTracking];

	CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
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
        AppDelegate *delegate = [[UIApplication sharedApplication] delegate];
        PushNotification *pushHandler = [delegate.viewController getCommandInstance:@"PushNotification"];
        pushHandler.startPushData = notification;
        pushHandler.startPushCleared = NO;
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

	CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:badge];
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
	[self.pushManager setUserId:userId];
}

- (void) postEvent:(CDVInvokedUrlCommand *)command {
	NSString *event = command.arguments[0];
	NSDictionary *attributes = command.arguments[1];
	[self.pushManager postEvent:event withAttributes:attributes];
}

- (void)addJavaScriptInterface:(CDVInvokedUrlCommand *)command {
    NSString *name = command.arguments[0];
    PWCommonJSBridge *bridge = [PWCommonJSBridge new];
    bridge.plugin = self;
    [[PWInAppManager sharedManager] addJavascriptInterface:bridge withName:name];
}

- (void)showGDPRConsentUI:(CDVInvokedUrlCommand *)command {
    [[PWGDPRManager sharedManager] showGDPRConsentUI];
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)showGDPRDeletionUI:(CDVInvokedUrlCommand *)command {
    [[PWGDPRManager sharedManager] showGDPRDeletionUI];
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
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

- (void)removeAllDeviceData:(CDVInvokedUrlCommand *)command {
    self.callbackIds[@"removeAllDeviceData"] = command.callbackId;
    
    [[PWGDPRManager sharedManager] removeAllDeviceDataWithCompletion:^(NSError *error) {
        if (!error) {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"removeAllDeviceData"]];
        } else {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.localizedDescription];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackIds[@"removeAllDeviceData"]];
        }
    }];
}

- (void)isCommunicationEnabled:(CDVInvokedUrlCommand *)command {
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:[[PWGDPRManager sharedManager] isCommunicationEnabled]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)isDeviceDataRemoved:(CDVInvokedUrlCommand *)command {
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:[[PWGDPRManager sharedManager] isDeviceDataRemoved]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)isAvailableGDPR:(CDVInvokedUrlCommand *)command {
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:[[PWGDPRManager sharedManager] isAvailable]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (UIImage *)imageFromInboxStyleDict:(NSDictionary *)dict forKey:(NSString *)key {
    NSObject *object = dict[key];
    if (object != nil && [object isKindOfClass:[NSString class]]) {
        return [UIImage imageWithContentsOfFile:[((CDVViewController *)self.viewController).commandDelegate pathForResource:(NSString *)object]];
    }
    return nil;
}

- (UIColor *)colorFromInboxStyleDict:(NSDictionary *)dict forKey:(NSString *)key {
    NSObject *object = dict[key];
    if (object != nil && [object isKindOfClass:[NSString class]]) {
        return [((CDVViewController *)self.viewController) colorFromColorString:(NSString *)object];
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
    
    if (![self.viewController isKindOfClass:[CDVViewController class]]) {
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

BOOL pwplugin_didRegisterUserNotificationSettings(id self, SEL _cmd, id application, id notificationSettings) {
	AppDelegate *delegate = [[UIApplication sharedApplication] delegate];
	PushNotification *pushHandler = [delegate.viewController getCommandInstance:@"PushNotification"];
	
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

- (NSObject<PushNotificationDelegate> *)getPushwooshDelegate {
	AppDelegate *delegate = [[UIApplication sharedApplication] delegate];
	PushNotification *pushHandler = [delegate.viewController getCommandInstance:@"PushNotification"];
	return pushHandler;
}

@end
