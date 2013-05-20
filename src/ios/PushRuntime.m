//
//  PushRuntime.m
//  Pushwoosh Phonegap SDK
//  (c) Pushwoosh 2012
//

#import "PushRuntime.h"
#import "PushNotificationManager.h"
#import <objc/runtime.h>

#import "PushNotification.h"
#import "PW_SBJsonParser.h"
#import "PW_SBJsonWriter.h"

@implementation AppDelegate(Pushwoosh)

- (void)application:(UIApplication *)application internalDidRegisterForRemoteNotificationsWithDeviceToken:(NSData *)devToken {
	PushNotification *pushHandler = [self.viewController getCommandInstance:@"PushNotification"];
	[pushHandler.pushManager handlePushRegistration:devToken];
	
    //you might want to send it to your backend if you use remote integration
	NSString *token = [pushHandler.pushManager getPushToken];
	NSLog(@"Push token: %@", token);
}

- (void)application:(UIApplication *)application newDidRegisterForRemoteNotificationsWithDeviceToken:(NSData *)devToken {
	[self application:application newDidRegisterForRemoteNotificationsWithDeviceToken:devToken];
	[self application:application internalDidRegisterForRemoteNotificationsWithDeviceToken:devToken];
}

- (void)application:(UIApplication *)application internalDidFailToRegisterForRemoteNotificationsWithError:(NSError *)err {
	PushNotification* pushHandler = [self.viewController getCommandInstance:@"PushNotification"];
	[pushHandler onDidFailToRegisterForRemoteNotificationsWithError:err];
}

- (void)application:(UIApplication *)application newDidFailToRegisterForRemoteNotificationsWithError:(NSError *)err {
	[self application:application newDidFailToRegisterForRemoteNotificationsWithError:err];
	[self application:application internalDidFailToRegisterForRemoteNotificationsWithError:err];
}

- (void)application:(UIApplication *)application internalDidReceiveRemoteNotification:(NSDictionary *)userInfo {
	PushNotification *pushHandler = [self.viewController getCommandInstance:@"PushNotification"];
	[pushHandler.pushManager handlePushReceived:userInfo];
}

- (void)application:(UIApplication *)application newDidReceiveRemoteNotification:(NSDictionary *)userInfo {
	[self application:application newDidReceiveRemoteNotification:userInfo];
	[self application:application internalDidReceiveRemoteNotification:userInfo];
}


- (BOOL)application:(UIApplication *)application newDidFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
	BOOL result = [self application:application newDidFinishLaunchingWithOptions:launchOptions];
	
	PushNotification *pushHandler = [self.viewController getCommandInstance:@"PushNotification"];
	if(!pushHandler || !pushHandler.pushManager)
		return result;
	
	[pushHandler.pushManager sendAppOpen];
	
	if(result) {
		NSDictionary * userInfo = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
		[pushHandler.pushManager handlePushReceived:userInfo];

		if(userInfo) {
			NSMutableDictionary *pn = [NSMutableDictionary dictionaryWithDictionary:userInfo];

			//convert userdata from JSON string to JSON Object
			NSString* u = [userInfo objectForKey:@"u"];
			if (u) {
				PW_SBJsonParser * json = [[PW_SBJsonParser alloc] init];
				NSDictionary *dict = [json objectWithString:u];
				[json release]; json = nil;
				
				if (dict) {
					[pn setObject:dict forKey:@"u"];
				}
			}
		
			[pn setValue:[NSNumber numberWithBool:YES] forKey:@"onStart"];
			
			PW_SBJsonWriter * json = [[PW_SBJsonWriter alloc] init];
			NSString *jsonString = [json stringWithObject:pn];
			[json release]; json = nil;
			
			//the webview is not loaded yet, keep it for the callback
			pushHandler.startPushData = jsonString;
		}
	}
	
	return result;
}

void dynamicMethodIMP(id self, SEL _cmd, id application, id param) {
	if (_cmd == @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:)) {
		[self application:application internalDidRegisterForRemoteNotificationsWithDeviceToken:param];
		return;
    }
	
	if (_cmd == @selector(application:didFailToRegisterForRemoteNotificationsWithError:)) {
		[self application:application internalDidFailToRegisterForRemoteNotificationsWithError:param];
		return;
    }
	
	if (_cmd == @selector(application:didReceiveRemoteNotification:)) {
		[self application:application internalDidReceiveRemoteNotification:param];
		return;
    }
}

+ (void)load {
	method_exchangeImplementations(class_getInstanceMethod(self, @selector(application:didFinishLaunchingWithOptions:)), class_getInstanceMethod(self, @selector(application:newDidFinishLaunchingWithOptions:)));
	
	//if methods does not exist - provide default implementation, otherwise swap the implementation
	Method method = nil;
	method = class_getInstanceMethod(self, @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:));
	if(method) {
		method_exchangeImplementations(method, class_getInstanceMethod(self, @selector(application:newDidRegisterForRemoteNotificationsWithDeviceToken:)));
	}
	else {
		class_addMethod(self, @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:), (IMP)dynamicMethodIMP, "v@:::");
	}
	
	method = class_getInstanceMethod(self, @selector(application:didFailToRegisterForRemoteNotificationsWithError:));
	if(method) {
		method_exchangeImplementations(class_getInstanceMethod(self, @selector(application:didFailToRegisterForRemoteNotificationsWithError:)), class_getInstanceMethod(self, @selector(application:newDidFailToRegisterForRemoteNotificationsWithError:)));
	}
	else {
		class_addMethod(self, @selector(application:didFailToRegisterForRemoteNotificationsWithError:), (IMP)dynamicMethodIMP, "v@:::");
	}
	
	method = class_getInstanceMethod(self, @selector(application:didReceiveRemoteNotification:));
	if(method) {
		method_exchangeImplementations(class_getInstanceMethod(self, @selector(application:didReceiveRemoteNotification:)), class_getInstanceMethod(self, @selector(application:newDidReceiveRemoteNotification:)));
	}
	else {
		class_addMethod(self, @selector(application:didReceiveRemoteNotification:), (IMP)dynamicMethodIMP, "v@:::");
	}
}

@end

@implementation UIApplication(Pushwoosh)

- (void) pw_setApplicationIconBadgeNumber:(NSInteger) badgeNumber {
	[self pw_setApplicationIconBadgeNumber:badgeNumber];
	
	[[PushNotificationManager pushManager] sendBadges:badgeNumber];
}

+ (void) load {
	method_exchangeImplementations(class_getInstanceMethod(self, @selector(setApplicationIconBadgeNumber:)), class_getInstanceMethod(self, @selector(pw_setApplicationIconBadgeNumber:)));
	
	UIApplication *app = [UIApplication sharedApplication];
	NSLog(@"Initializing application: %@, %@", app, app.delegate);
}

@end