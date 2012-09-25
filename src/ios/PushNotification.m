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
#import <Cordova/JSONKit.h>
#import <CoreLocation/CoreLocation.h>
#import "AppDelegate.h"

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
		AppDelegate * delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
		UIViewController * mainVC = delegate.viewController;
		
		NSString * appid = [[NSUserDefaults standardUserDefaults] objectForKey:@"Pushwoosh_APPID"];
		
		if(!appid)
			return nil;
		
		NSString * appname = [[NSUserDefaults standardUserDefaults] objectForKey:@"Pushwoosh_APPNAME"];
		if(!appname)
			appname = @"";
			
		pushManager = [[PushNotificationManager alloc] initWithApplicationCode:appid navController:mainVC appName:appname ];
		pushManager.delegate = self;
	}
	return pushManager;
}

- (void)onDeviceReady:(NSMutableArray *)arguments withDict:(NSMutableDictionary*)options {
	AppDelegate *delegate = [[UIApplication sharedApplication] delegate];
	PushNotification *pushHandler = [delegate.viewController getCommandInstance:@"PushNotification"];
	if(pushHandler.startPushData) {
		NSString *jsStatement = [NSString stringWithFormat:@"window.plugins.pushNotification.notificationCallback(%@);", pushHandler.startPushData];
		[pushHandler writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", jsStatement]];
		pushHandler.startPushData = nil;
	}
}

- (void)registerDevice:(NSMutableArray *)arguments withDict:(NSMutableDictionary *)options {

	// The first argument in the arguments parameter is the callbackID.
	[self.callbackIds setValue:[arguments pop] forKey:@"registerDevice"];

	UIRemoteNotificationType notificationTypes = UIRemoteNotificationTypeNone;
	if ([options objectForKey:@"badge"]) {
		notificationTypes |= UIRemoteNotificationTypeBadge;
	}
	if ([options objectForKey:@"sound"]) {
		notificationTypes |= UIRemoteNotificationTypeSound;
	}
	if ([options objectForKey:@"alert"]) {
		notificationTypes |= UIRemoteNotificationTypeAlert;
	}

	if (notificationTypes == UIRemoteNotificationTypeNone)
		NSLog(@"PushNotification.registerDevice: Push notification type is set to none");
	
	NSString *appid = [options objectForKey:@"pw_appid"];
	NSString *appname = [options objectForKey:@"appname"];
	
	if(!appid) {
		NSLog(@"PushNotification.registerDevice: Missing Pushwoosh App ID");
		return;
	}
	
	[[NSUserDefaults standardUserDefaults] setObject:appid forKey:@"Pushwoosh_APPID"];
	if(appname) {
		[[NSUserDefaults standardUserDefaults] setObject:appname forKey:@"Pushwoosh_APPNAME"];
	}
	
	[[UIApplication sharedApplication] registerForRemoteNotificationTypes:notificationTypes];

}

- (void)setTags:(NSMutableArray *)arguments withDict:(NSMutableDictionary*)options {
	// The first argument in the arguments parameter is the callbackID.
	[self.callbackIds setValue:[arguments pop] forKey:@"setTags"];
	
	[[PushNotificationManager pushManager] setTags:options];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self writeJavascript:[pluginResult toSuccessCallbackString:[self.callbackIds valueForKey:@"setTags"]]];

}

- (void)sendLocation:(NSMutableArray *)arguments withDict:(NSMutableDictionary*)options {
	// The first argument in the arguments parameter is the callbackID.
	[self.callbackIds setValue:[arguments pop] forKey:@"sendLocation"];
	
	NSNumber * lat = [options objectForKey:@"lat"];
	NSNumber * lon = [options objectForKey:@"lon"];
	CLLocation * location = [[CLLocation alloc] initWithLatitude:[lat doubleValue] longitude:[lon doubleValue]];
	[[PushNotificationManager pushManager] sendLocation:location];
	[location release];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:nil];
	[self writeJavascript:[pluginResult toSuccessCallbackString:[self.callbackIds valueForKey:@"sendLocation"]]];
	
}

- (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSString *)token {

    NSMutableDictionary *results = [PushNotification getRemoteNotificationStatus];
    [results setValue:token forKey:@"deviceToken"];

	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
	[self writeJavascript:[pluginResult toSuccessCallbackString:[self.callbackIds valueForKey:@"registerDevice"]]];
}

- (void)didFailToRegisterForRemoteNotificationsWithError:(NSError*)error {

	NSMutableDictionary *results = [NSMutableDictionary dictionary];
	[results setValue:[NSString stringWithFormat:@"%@", error] forKey:@"error"];

	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:results];
	[self writeJavascript:[pluginResult toErrorCallbackString:[self.callbackIds valueForKey:@"registerDevice"]]];
}


- (void) onPushAccepted:(PushNotificationManager *)manager withNotification:(NSDictionary *)pushNotification{
	//reset badge counter
	[[UIApplication sharedApplication] setApplicationIconBadgeNumber:0];
	
	NSString* u = [pushNotification objectForKey:@"u"];
	if (u) {
		NSDictionary *dict = [u cdvjk_objectFromJSONString];
		if (dict) {
			NSMutableDictionary *pn = [NSMutableDictionary dictionaryWithDictionary:pushNotification];
			[pn setObject:dict forKey:@"u"];
			pushNotification = pn;
		}
	}
	
	NSString *jsonString = [pushNotification cdvjk_JSONString];
	NSString *jsStatement = [NSString stringWithFormat:@"window.plugins.pushNotification.notificationCallback(%@);", jsonString];
	[self writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", jsStatement]];
}

+ (NSMutableDictionary*)getRemoteNotificationStatus {

    NSMutableDictionary *results = [NSMutableDictionary dictionary];

    NSUInteger type = 0;
    // Set the defaults to disabled unless we find otherwise...
    NSString *pushBadge = @"0";
    NSString *pushAlert = @"0";
    NSString *pushSound = @"0";

#if !TARGET_IPHONE_SIMULATOR

    // Check what Notifications the user has turned on.  We registered for all three, but they may have manually disabled some or all of them.
    type = [[UIApplication sharedApplication] enabledRemoteNotificationTypes];

    // Check what Registered Types are turned on. This is a bit tricky since if two are enabled, and one is off, it will return a number 2... not telling you which
    // one is actually disabled. So we are literally checking to see if rnTypes matches what is turned on, instead of by number. The "tricky" part is that the
    // single notification types will only match if they are the ONLY one enabled.  Likewise, when we are checking for a pair of notifications, it will only be
    // true if those two notifications are on.  This is why the code is written this way
    if(type == UIRemoteNotificationTypeBadge){
        pushBadge = @"1";
    }
    else if(type == UIRemoteNotificationTypeAlert) {
        pushAlert = @"1";
    }
    else if(type == UIRemoteNotificationTypeSound) {
        pushSound = @"1";
    }
    else if(type == ( UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeAlert)) {
        pushBadge = @"1";
        pushAlert = @"1";
    }
    else if(type == ( UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound)) {
        pushBadge = @"1";
        pushSound = @"1";
    }
    else if(type == ( UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeSound)) {
        pushAlert = @"1";
        pushSound = @"1";
    }
    else if(type == ( UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeSound)) {
        pushBadge = @"1";
        pushAlert = @"1";
        pushSound = @"1";
    }

#endif

    // Affect results
    [results setValue:[NSString stringWithFormat:@"%d", type] forKey:@"type"];
	[results setValue:[NSString stringWithFormat:@"%d", type != UIRemoteNotificationTypeNone] forKey:@"enabled"];
    [results setValue:pushBadge forKey:@"pushBadge"];
    [results setValue:pushAlert forKey:@"pushAlert"];
    [results setValue:pushSound forKey:@"pushSound"];

    return results;

}

- (void)getRemoteNotificationStatus:(NSMutableArray *)arguments withDict:(NSMutableDictionary *)options {

	// The first argument in the arguments parameter is the callbackID.
	[self.callbackIds setValue:[arguments pop] forKey:@"getRemoteNotificationStatus"];

	NSMutableDictionary *results = [PushNotification getRemoteNotificationStatus];

	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
	[self writeJavascript:[pluginResult toSuccessCallbackString:[self.callbackIds valueForKey:@"getRemoteNotificationStatus"]]];
}

- (void)setApplicationIconBadgeNumber:(NSMutableArray *)arguments withDict:(NSMutableDictionary *)options {

	// The first argument in the arguments parameter is the callbackID.
	[self.callbackIds setValue:[arguments pop] forKey:@"setApplicationIconBadgeNumber"];

    int badge = [[options objectForKey:@"badge"] intValue] ?: 0;
    [[UIApplication sharedApplication] setApplicationIconBadgeNumber:badge];

    NSMutableDictionary *results = [NSMutableDictionary dictionary];
	[results setValue:[NSNumber numberWithInt:badge] forKey:@"badge"];
    [results setValue:[NSNumber numberWithInt:1] forKey:@"success"];

	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
	[self writeJavascript:[pluginResult toSuccessCallbackString:[self.callbackIds valueForKey:@"setApplicationIconBadgeNumber"]]];
}

- (void)cancelAllLocalNotifications:(NSMutableArray *)arguments withDict:(NSMutableDictionary *)options {

	// The first argument in the arguments parameter is the callbackID.
	[self.callbackIds setValue:[arguments pop] forKey:@"cancelAllLocalNotifications"];
	
	[[UIApplication sharedApplication] cancelAllLocalNotifications];
	
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
	[self writeJavascript:[pluginResult toSuccessCallbackString:[self.callbackIds valueForKey:@"cancelAllLocalNotifications"]]];
}

- (void) dealloc {
	self.pushManager = nil;
	self.startPushData = nil;

	[_callbackIds dealloc];
	[super dealloc];
}

@end
