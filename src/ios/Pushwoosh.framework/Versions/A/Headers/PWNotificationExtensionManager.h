//
//  PWNotificationExtensionManager.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2019
//

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface PWNotificationExtensionManager : NSObject

+ (instancetype)sharedManager;

/**
 Sends message delivery event to Pushwoosh and downloads media attachment. Call it from UNNotificationServiceExtension. Don't forget to set Pushwoosh_APPID in extension Info.plist.
 
 Example:
 @code
 - (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
     self.contentHandler = contentHandler;
     self.bestAttemptContent = [request.content mutableCopy];
     
     [[PWNotificationExtensionManager sharedManager] handleNotificationRequest:request contentHandler:contentHandler];
 }
 @endcode
 */
- (void)handleNotificationRequest:(UNNotificationRequest *)request contentHandler:(void (^)(UNNotificationContent *))contentHandler;

/**
 Example:
 @code
 - (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
     self.contentHandler = contentHandler;
     self.bestAttemptContent = [request.content mutableCopy];
     
     [[PWNotificationExtensionManager sharedManager] handleNotificationRequest:request withAppGroups:@"group.com.example_domain.example_app_name."];
 }
 @endcode
 */
- (void)handleNotificationRequest:(UNNotificationRequest *)request withAppGroups:(NSString * _Nullable)appGroupsName;

@end

NS_ASSUME_NONNULL_END
