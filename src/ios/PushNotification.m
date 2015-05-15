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
#import <CoreLocation/CoreLocation.h>
#import "AppDelegate.h"

#define WRITEJS(VAL) [NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", VAL]

@implementation PushNotification

@synthesize callbackIds = _callbackIds;
@synthesize pushManager, startPushData;

- (NSMutableDictionary*)callbackIds {
	if(_callbackIds == nil) {
		_callbackIds = [[NSMutableDictionary alloc] init];
	}
	return _callbackIds;
}

- (PushNotificationManager*)pushManager {
	if(pushManager == nil) {
		pushManager = [PushNotificationManager pushManager];
		pushManager.delegate = self;
		pushManager.showPushnotificationAlert = FALSE;
	}
	return pushManager;
}

- (void)getPushToken:(CDVInvokedUrlCommand*)command {
	NSString * token = [[PushNotificationManager pushManager] getPushToken];
	CDVPluginResult * pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:token];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getPushwooshHWID:(CDVInvokedUrlCommand*)command {
	NSString * token = [[PushNotificationManager pushManager] getHWID];
	CDVPluginResult * pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:token];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)onDeviceReady:(CDVInvokedUrlCommand*)command {
	NSDictionary *options = nil;
	if(command.arguments.count != 0)
		options = [command.arguments objectAtIndex:0];

	NSString *appid = [options objectForKey:@"pw_appid"];
	NSString *appname = [options objectForKey:@"appname"];
	
	if(!appid) {
		//no Pushwoosh App Id provided in JS call, let's try Info.plist (SDK default)
		if(self.pushManager == nil)
		{
			NSLog(@"PushNotification.registerDevice: Missing Pushwoosh App ID");
			return;
		}
	}
	
	if(appid) {
		[[NSUserDefaults standardUserDefaults] setObject:appid forKey:@"Pushwoosh_APPID"];
		//we need to re-set APPID if it has been changed (on start we have initialized Push Manager with app id from NSUserDefaults)
		self.pushManager.appCode = appid;
	}
	
	if(appname) {
		[[NSUserDefaults standardUserDefaults] setObject:appname forKey:@"Pushwoosh_APPNAME"];
		//and name if it has been provided
		self.pushManager.appName = appname;
	}

	AppDelegate *delegate = [[UIApplication sharedApplication] delegate];
	PushNotification *pushHandler = [delegate.viewController getCommandInstance:@"PushNotification"];
	if(pushHandler.startPushData && !deviceReady) {
		NSString *jsStatement = [NSString stringWithFormat:@"cordova.require(\"com.pushwoosh.plugins.pushwoosh.PushNotification\").notificationCallback(%@);", pushHandler.startPushData];
		[self.commandDelegate evalJs:WRITEJS(jsStatement)];
	}
    
	deviceReady = YES;

	[[NSUserDefaults standardUserDefaults] synchronize];
}

- (void)registerDevice:(CDVInvokedUrlCommand*)command {
	[self.callbackIds setValue:command.callbackId forKey:@"registerDevice"];

	//Cordova BUG: https://issues.apache.org/jira/browse/CB-8063
//	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT messageAsDictionary:nil];
//	[pluginResult setKeepCallbackAsBool:YES];
//	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	
	[[PushNotificationManager pushManager] registerForPushNotifications];

}

- (void)unregisterDevice:(CDVInvokedUrlCommand*)command {
	[[PushNotificationManager pushManager] unregisterForPushNotifications];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)startBeaconPushes:(CDVInvokedUrlCommand*)command {
	[[PushNotificationManager pushManager] startBeaconTracking];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)stopBeaconPushes:(CDVInvokedUrlCommand*)command {
	[[PushNotificationManager pushManager] stopBeaconTracking];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setTags:(CDVInvokedUrlCommand*)command {
	[[PushNotificationManager pushManager] setTags:[command.arguments objectAtIndex:0]];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getTags:(CDVInvokedUrlCommand*)command {
	// The first argument in the arguments parameter is the callbackID.
	[self.callbackIds setValue:command.callbackId forKey:@"getTags"];

	//Cordova BUG: https://issues.apache.org/jira/browse/CB-8063
//	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT messageAsDictionary:nil];
//	[pluginResult setKeepCallbackAsBool:YES];
//	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	
	[[PushNotificationManager pushManager] loadTags:
		^(NSDictionary *tags) {
			CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:tags];
			[self.commandDelegate sendPluginResult:pluginResult callbackId:[self.callbackIds valueForKey:@"getTags"]];
		}
		error:^(NSError *error) {
			NSMutableDictionary *results = [NSMutableDictionary dictionary];
			[results setValue:[NSString stringWithFormat:@"%@", error] forKey:@"error"];

			CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:results];
			[self.commandDelegate sendPluginResult:pluginResult callbackId:[self.callbackIds valueForKey:@"getTags"]];
		 }
	 ];
}

- (void)sendLocation:(CDVInvokedUrlCommand*)command {
	
	NSNumber * lat = [[command.arguments objectAtIndex:0] objectForKey:@"lat"];
	NSNumber * lon = [[command.arguments objectAtIndex:0] objectForKey:@"lon"];
	CLLocation * location = [[CLLocation alloc] initWithLatitude:[lat doubleValue] longitude:[lon doubleValue]];
	[[PushNotificationManager pushManager] sendLocation:location];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)startLocationTracking:(CDVInvokedUrlCommand*)command {
	
	[[PushNotificationManager pushManager] startLocationTracking];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)stopLocationTracking:(CDVInvokedUrlCommand*)command {
	[[PushNotificationManager pushManager] stopLocationTracking];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)onDidRegisterForRemoteNotificationsWithDeviceToken:(NSString *)token {

    NSMutableDictionary *results = [PushNotification getRemoteNotificationStatus];
    [results setValue:token forKey:@"deviceToken"];

	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:[self.callbackIds valueForKey:@"registerDevice"]];
}

- (void)onDidFailToRegisterForRemoteNotificationsWithError:(NSError*)error {

	NSMutableDictionary *results = [NSMutableDictionary dictionary];
	[results setValue:[NSString stringWithFormat:@"%@", error] forKey:@"error"];

	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:results];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:[self.callbackIds valueForKey:@"registerDevice"]];
}


- (void) onPushAccepted:(PushNotificationManager *)manager withNotification:(NSDictionary *)pushNotification onStart:(BOOL)onStart{
	//reset badge counter
	[[UIApplication sharedApplication] setApplicationIconBadgeNumber:0];
	
	NSMutableDictionary *pn = [NSMutableDictionary dictionaryWithDictionary:pushNotification];

	//pase JSON string in custom data to JSON Object
	NSString* u = [pushNotification objectForKey:@"u"];
    
	if (u) {
        NSDictionary *dict = [NSJSONSerialization JSONObjectWithData:[u dataUsingEncoding:NSUTF8StringEncoding]
                                                             options:NSJSONReadingMutableContainers
                                                               error:nil];
		
		if (dict) {
			[pn setObject:dict forKey:@"u"];
			
			//Android passes parameter as userdata too, align with Android
			[pn setObject:dict forKey:@"userdata"];
		}
	}
	
	[pn setValue:[NSNumber numberWithBool:onStart] forKey:@"onStart"];
	
	NSData *json = [NSJSONSerialization dataWithJSONObject:pn options:NSJSONWritingPrettyPrinted error:nil];
	NSString *jsonString = [[NSString alloc] initWithData:json encoding:NSUTF8StringEncoding];
	
	if(!onStart && !deviceReady) {
		NSLog(@"PUSHWOOSH WARNING: push notification onStart is false, but onDeviceReady has not been called. Did you forget to call onDeviceReady?");
	}
    
	if(onStart) {
		//keep the start push
		AppDelegate *delegate = [[UIApplication sharedApplication] delegate];
		PushNotification *pushHandler = [delegate.viewController getCommandInstance:@"PushNotification"];
		pushHandler.startPushData = jsonString;
	}
	
	if(deviceReady) {
		//send it to the webview
		NSString *jsStatement = [NSString stringWithFormat:@"cordova.require(\"com.pushwoosh.plugins.pushwoosh.PushNotification\").notificationCallback(%@);", jsonString];
		[self.commandDelegate evalJs:WRITEJS(jsStatement)];
	}
}

+ (NSMutableDictionary *)getRemoteNotificationStatus {
    NSMutableDictionary *results = [NSMutableDictionary dictionary];
	
	NSInteger type = 0;
    // Set the defaults to disabled unless we find otherwise...
    NSString *pushBadge = @"0";
    NSString *pushAlert = @"0";
    NSString *pushSound = @"0";
    NSString *pushEnabled = @"0";
    
    // Check what Notifications the user has turned on.  We registered for all three, but they may have manually disabled some or all of them.
	
#ifdef __IPHONE_8_0
	if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 8.0)
	{
		if([[UIApplication sharedApplication] isRegisteredForRemoteNotifications])
			pushEnabled = @"1";

		UIUserNotificationSettings * settings = [[UIApplication sharedApplication] currentUserNotificationSettings];
		type = settings.types;
		if(type & UIUserNotificationTypeBadge){
			pushBadge = @"1";
		}
		if(type & UIUserNotificationTypeAlert) {
			pushAlert = @"1";
		}
		if(type & UIUserNotificationTypeSound) {
			pushSound = @"1";
		}
	}
	else
#endif
	{
		type = [[UIApplication sharedApplication] enabledRemoteNotificationTypes];
		if(type & UIRemoteNotificationTypeBadge){
			pushBadge = @"1";
		}
		if(type & UIRemoteNotificationTypeAlert) {
			pushAlert = @"1";
		}
		if(type & UIRemoteNotificationTypeSound) {
			pushSound = @"1";
		}

		if(type != UIRemoteNotificationTypeNone)
			pushEnabled = @"1";
	}
	
    // Affect results
    [results setValue:[NSString stringWithFormat:@"%d", (int)type] forKey:@"type"];
    [results setValue:pushEnabled forKey:@"enabled"];
    [results setValue:pushBadge forKey:@"pushBadge"];
    [results setValue:pushAlert forKey:@"pushAlert"];
    [results setValue:pushSound forKey:@"pushSound"];
    
    return results;
}

- (void)getRemoteNotificationStatus:(CDVInvokedUrlCommand*)command {

	NSMutableDictionary *results = [PushNotification getRemoteNotificationStatus];

	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setApplicationIconBadgeNumber:(CDVInvokedUrlCommand*)command {

	int badge = [[[command.arguments objectAtIndex:0] objectForKey:@"badge"] intValue];
	[[UIApplication sharedApplication] setApplicationIconBadgeNumber:badge];

	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getApplicationIconBadgeNumber:(CDVInvokedUrlCommand*)command {
	
	NSInteger badge = [UIApplication sharedApplication].applicationIconBadgeNumber;
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:badge];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)addToApplicationIconBadgeNumber:(CDVInvokedUrlCommand*)command {

	int badge = [[[command.arguments objectAtIndex:0] objectForKey:@"badge"] intValue];
	[UIApplication sharedApplication].applicationIconBadgeNumber += badge;
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)cancelAllLocalNotifications:(CDVInvokedUrlCommand*)command {

	[[UIApplication sharedApplication] cancelAllLocalNotifications];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getLaunchNotification:(CDVInvokedUrlCommand*)command {
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:self.startPushData];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) dealloc {
	self.pushManager = nil;
	self.startPushData = nil;
}

@end

@implementation UIApplication(InternalPushRuntime)
- (BOOL) pushwooshUseRuntimeMagic {
	return YES;
}

- (NSObject<PushNotificationDelegate> *)getPushwooshDelegate {
	AppDelegate *delegate = [[UIApplication sharedApplication] delegate];
	PushNotification *pushHandler = [delegate.viewController getCommandInstance:@"PushNotification"];
	return pushHandler;
}
@end
