//
//  PWInAppManager.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2017
//

#import <Foundation/Foundation.h>

#if TARGET_OS_IOS

#import <WebKit/WebKit.h>
/**
 `PWJavaScriptInterface` protocol is a representation of Javascript object that can be added at runtime into In-App Message HTML page
 to provide native calls and callbacks to Objective-C/Swift.
 
 Example:
 
 Objective-C:
 @code
 @implementation JavaScriptInterface

 - (void)nativeCall:(NSString*)str :(PWJavaScriptCallback*)callback {
	[callback executeWithParam:str];
 }
 
 @end

 ...
 
 [[PWInAppManager sharedManager] addJavascriptInterface:[JavaScriptInterface new] withName:@"ObjC"];
 @endcode
 
 JavaScript:
 @code
 ObjC.nativeCall("exampleString", function(str) {
	console.log(str);
 });
 @endcode
 */
@protocol PWJavaScriptInterface

@optional

/**
 Tells the delegate that In-App Message load stated
 */
- (void)onWebViewStartLoad:(WKWebView *)webView;

/**
 Tells the delegate that In-App Message load finished
 */
- (void)onWebViewFinishLoad:(WKWebView *)webView;

/**
 Tells the delegate that In-App Message is closing
 */
- (void)onWebViewStartClose:(WKWebView *)webView;

@end

/**
 `PWJavaScriptCallback` is a representation of Javascript function
 */
@interface PWJavaScriptCallback : NSObject

/**
 Invokes callback with no arguments
 */
- (NSString*) execute;

/**
 Invokes callback with one argument
 */
- (NSString*) executeWithParam: (NSString*) param;

/**
 Invokes callback with multiple arguments
 */
- (NSString*) executeWithParams: (NSArray*) params;

@end

#endif


/*
 `PWInAppManager` class offers access to the singleton-instance of the inapp messages manager responsible for sending events and managing inapp message notifications.
 */
@interface PWInAppManager : NSObject


+ (instancetype)sharedManager;

#if TARGET_OS_IOS || TARGET_OS_OSX
/**
 Resets capping of the Pushwoosh out-of-the-box In-App solutions.
 */
- (void)resetBusinessCasesFrequencyCapping;

#endif
/**
 Set User indentifier. This could be Facebook ID, username or email, or any other user ID.
 This allows data and events to be matched across multiple user devices.
 */
- (void)setUserId:(NSString *)userId;

/**
 Set User indentifier. This could be Facebook ID, username or email, or any other user ID.
 This allows data and events to be matched across multiple user devices.
 If setUser succeeds competion is called with nil argument. If setUser fails completion is called with error.
 */
- (void)setUserId:(NSString *)userId completion:(void(^)(NSError * error))completion;

/**
 Set User indentifier. This could be Facebook ID, username or email, or any other user ID.
 This allows data and events to be matched across multiple user devices.

 @param userId user identifier
 @param emails user's emails array
 */
- (void)setUser:(NSString *)userId emails:(NSArray *)emails completion:(void(^)(NSError * error))completion;

/**
 Register emails list associated to the current user.
 
 @param emails user's emails array
 */
- (void)setEmails:(NSArray *)emails completion:(void(^)(NSError * error))completion;

/**
 Move all events from oldUserId to newUserId if doMerge is true. If doMerge is false all events for oldUserId are removed.
 
 @param oldUserId source user
 @param newUserId destination user
 @param doMerge if false all events for oldUserId are removed, if true all events for oldUserId are moved to newUserId
 @param completion callback
 */
- (void)mergeUserId:(NSString *)oldUserId to:(NSString *)newUserId doMerge:(BOOL)doMerge completion:(void (^)(NSError *error))completion;

/**
 Post events for In-App Messages. This can trigger In-App message display as specified in Pushwoosh Control Panel.
 
 Example:
 @code
 [[PWInAppManager sharedManager] setUserId:@"96da2f590cd7246bbde0051047b0d6f7"];
 [[PWInAppManager sharedManager] postEvent:@"buttonPressed" withAttributes:@{ @"buttonNumber" : @"4", @"buttonLabel" : @"Banner" } completion:nil];
 @endcode
 
 @param event name of the event
 @param attributes NSDictionary of event attributes
 @param completion function to call after posting event
 */
- (void)postEvent:(NSString *)event withAttributes:(NSDictionary *)attributes completion:(void (^)(NSError *error))completion;

/**
 See `postEvent:withAttributes:completion:`
 */
- (void)postEvent:(NSString *)event withAttributes:(NSDictionary *)attributes;

#if TARGET_OS_IOS

/**
 Adds javascript interface for In-App Messages. Interface will be accessible from javascript as object with specified `name` and functions defined in `interface` class.
 */
- (void)addJavascriptInterface:(NSObject<PWJavaScriptInterface>*)interface withName:(NSString*)name;

/**
 Updates In-App messages storage on a device
 */

- (void)reloadInAppsWithCompletion: (void (^)(NSError *error))completion;

#endif

@end
