//
//  PushRuntime.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface UIApplication(SupressWarnings)
- (void)application:(UIApplication *)application pw_didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)devToken;
- (void)application:(UIApplication *)application pw_didFailToRegisterForRemoteNotificationsWithError:(NSError *)err;
- (void)application:(UIApplication *)application pw_didReceiveRemoteNotification:(NSDictionary *)userInfo;

- (BOOL)application:(UIApplication *)application pw_didFinishLaunchingWithOptions:(NSDictionary *)launchOptions;
@end

