//
//  PushRuntime.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "AppDelegate.h"

@interface AppDelegate (Pushwoosh)
- (void)application:(UIApplication *)application newDidRegisterForRemoteNotificationsWithDeviceToken:(NSData *)devToken;
- (void)application:(UIApplication *)application newDidFailToRegisterForRemoteNotificationsWithError:(NSError *)err;
- (void)application:(UIApplication *)application newDidReceiveRemoteNotification:(NSDictionary *)userInfo;

- (BOOL)application:(UIApplication *)application newDidFinishLaunchingWithOptions:(NSDictionary *)launchOptions;
@end


