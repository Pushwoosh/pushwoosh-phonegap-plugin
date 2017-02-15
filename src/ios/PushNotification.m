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

#import "AppDelegate.h"

#import <CoreLocation/CoreLocation.h>
#import <UserNotifications/UserNotifications.h>

#import <objc/runtime.h>


#define WRITEJS(VAL) [NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", VAL]

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
	
	AppDelegate *delegate = [[UIApplication sharedApplication] delegate];
	PushNotification *pushHandler = [delegate.viewController getCommandInstance:@"PushNotification"];
	if (pushHandler.startPushData && !_deviceReady) {
		[self dispatchPush:pushHandler.startPushData];
	}

	_deviceReady = YES;

	[[NSUserDefaults standardUserDefaults] synchronize];
}

- (void)dispatchPush:(NSDictionary *)pushData {
	NSData *json = [NSJSONSerialization dataWithJSONObject:pushData options:NSJSONWritingPrettyPrinted error:nil];
	NSString *jsonString = [[NSString alloc] initWithData:json encoding:NSUTF8StringEncoding];

	NSString *pushOpenJsStatement = [NSString stringWithFormat: @"cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").notificationCallback(%@);", jsonString];
	NSString *pushReceiveJsStatement = [NSString stringWithFormat: @"cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").pushReceivedCallback(%@);", jsonString];

	if ([[UIApplication sharedApplication] applicationState] == UIApplicationStateBackground) {
		[self.commandDelegate evalJs:WRITEJS(pushReceiveJsStatement)];
	}
	else if ([[UIApplication sharedApplication] applicationState] == UIApplicationStateActive) {
		[self.commandDelegate evalJs:WRITEJS(pushReceiveJsStatement)];
		[self.commandDelegate evalJs:WRITEJS(pushOpenJsStatement)];
	}
	else {
		[self.commandDelegate evalJs:WRITEJS(pushOpenJsStatement)];
	}
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
	[[PushNotificationManager pushManager] unregisterForPushNotifications];

	CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
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

- (void)onPushAccepted:(PushNotificationManager *)manager
	  withNotification:(NSDictionary *)pushNotification
			   onStart:(BOOL)onStart {
	
	if (!onStart && !_deviceReady) {
		PWLogWarn(@"PUSHWOOSH WARNING: push notification onStart is false, but onDeviceReady has not been called. Did you "
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
	
	//pase JSON string in custom data to JSON Object
	NSString *userdata = pushNotification[@"u"];

	if (userdata) {
		id parsedData = [NSJSONSerialization JSONObjectWithData:[userdata dataUsingEncoding:NSUTF8StringEncoding]
															 options:NSJSONReadingMutableContainers
															   error:nil];

		if (parsedData) {
			notification[@"userdata"] = parsedData;
		}
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

	if (_deviceReady) {
		//send it to the webview
		[self dispatchPush:notification];
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
