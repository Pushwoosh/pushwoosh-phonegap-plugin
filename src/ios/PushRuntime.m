//
//  PushRuntime.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PushRuntime.h"
#import "PushNotificationManager.h"
#import <objc/runtime.h>

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

@interface UIApplication(InternalPushRuntime)
- (NSObject<PushNotificationDelegate> *)getPushwooshDelegate;
- (BOOL) pushwooshDontAutoRegister;
@end

static void swizze(Class class, SEL fromChange, SEL toChange, IMP impl, const char * signature)
{
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

int getPushNotificationMode() {
	//default push modes
	int modes = UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound | UIRemoteNotificationTypeAlert;
	
	//add newsstand mode if info.plist supports it
	NSArray * backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
	for(NSString *mode in backgroundModes) {
		if([mode isEqualToString:@"newsstand-content"]) {
			modes |= UIRemoteNotificationTypeNewsstandContentAvailability;
			break;
		}
	}

	return modes;
}

@implementation UIApplication(Pushwoosh)

BOOL dynamicDidFinishLaunching(id self, SEL _cmd, id application, id launchOptions) {
	BOOL result = YES;
	
	if ([self respondsToSelector:@selector(application:pw_didFinishLaunchingWithOptions:)]) {
		result = (BOOL) [self application:application pw_didFinishLaunchingWithOptions:launchOptions];
	} else {
		[self applicationDidFinishLaunching:application];
		result = YES;
	}
	
	int modes = getPushNotificationMode();

	if(![[UIApplication sharedApplication] respondsToSelector:@selector(pushwooshDontAutoRegister)]) {
		BOOL autoRegisterMode = ![[[NSBundle mainBundle] objectForInfoDictionaryKey:@"Pushwoosh_NOAUTOREGISTER"] boolValue];
		if (autoRegisterMode) {
			[[UIApplication sharedApplication] registerForRemoteNotificationTypes:modes];
		}
	}
	
	if(![PushNotificationManager pushManager].delegate) {
		if([[UIApplication sharedApplication] respondsToSelector:@selector(getPushwooshDelegate)])
		{
			[PushNotificationManager pushManager].delegate = [[UIApplication sharedApplication] getPushwooshDelegate];
		}
		else
		{
			[PushNotificationManager pushManager].delegate = (NSObject<PushNotificationDelegate> *)self;
		}
	}
	
    if ([launchOptions objectForKey:UIApplicationLaunchOptionsLocationKey]) {
        [[PushNotificationManager pushManager] startLocationTracking];
    }
    
	[[PushNotificationManager pushManager] handlePushReceived:launchOptions];
	[[PushNotificationManager pushManager] sendAppOpen];
	
	return result;
}

void dynamicDidRegisterForRemoteNotificationsWithDeviceToken(id self, SEL _cmd, id application, id devToken) {
	if ([self respondsToSelector:@selector(application:pw_didRegisterForRemoteNotificationsWithDeviceToken:)]) {
		[self application:application pw_didRegisterForRemoteNotificationsWithDeviceToken:devToken];
	}
	
	[[PushNotificationManager pushManager] handlePushRegistration:devToken];
}

void dynamicDidFailToRegisterForRemoteNotificationsWithError(id self, SEL _cmd, id application, id error) {
	if ([self respondsToSelector:@selector(application:pw_didFailToRegisterForRemoteNotificationsWithError:)]) {
		[self application:application pw_didFailToRegisterForRemoteNotificationsWithError:error];
	}
	
	NSLog(@"Error registering for push notifications. Error: %@", error);
	
	[[PushNotificationManager pushManager] handlePushRegistrationFailure:error];
}

void dynamicDidReceiveRemoteNotification(id self, SEL _cmd, id application, id userInfo) {
	if ([self respondsToSelector:@selector(application:pw_didReceiveRemoteNotification:)]) {
		[self application:application pw_didReceiveRemoteNotification:userInfo];
	}
	
	[[PushNotificationManager pushManager] handlePushReceived:userInfo];
}


- (void) pw_setDelegate:(id<UIApplicationDelegate>)delegate {

	static Class delegateClass = nil;
	
	//do not swizzle the same class twice
	if(delegateClass == [delegate class])
	{
		[self pw_setDelegate:delegate];
		return;
	}
	
	delegateClass = [delegate class];
	
	swizze([delegate class], @selector(application:didFinishLaunchingWithOptions:),
		   @selector(application:pw_didFinishLaunchingWithOptions:), (IMP)dynamicDidFinishLaunching, "v@:::");

	swizze([delegate class], @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:),
		   @selector(application:pw_didRegisterForRemoteNotificationsWithDeviceToken:), (IMP)dynamicDidRegisterForRemoteNotificationsWithDeviceToken, "v@:::");

	swizze([delegate class], @selector(application:didFailToRegisterForRemoteNotificationsWithError:),
		   @selector(application:pw_didFailToRegisterForRemoteNotificationsWithError:), (IMP)dynamicDidFailToRegisterForRemoteNotificationsWithError, "v@:::");

	swizze([delegate class], @selector(application:didReceiveRemoteNotification:),
		   @selector(application:pw_didReceiveRemoteNotification:), (IMP)dynamicDidReceiveRemoteNotification, "v@:::");
	
	[self pw_setDelegate:delegate];
}

- (void) pw_setApplicationIconBadgeNumber:(NSInteger) badgeNumber {
	[self pw_setApplicationIconBadgeNumber:badgeNumber];
	
	[[PushNotificationManager pushManager] sendBadges:badgeNumber];
}

+ (void) load {
	method_exchangeImplementations(class_getInstanceMethod(self, @selector(setApplicationIconBadgeNumber:)), class_getInstanceMethod(self, @selector(pw_setApplicationIconBadgeNumber:)));
	method_exchangeImplementations(class_getInstanceMethod(self, @selector(setDelegate:)), class_getInstanceMethod(self, @selector(pw_setDelegate:)));
	
	UIApplication *app = [UIApplication sharedApplication];
	NSLog(@"Initializing application: %@, %@", app, app.delegate);
}

@end
