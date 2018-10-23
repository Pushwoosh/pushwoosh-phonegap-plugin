//
//  PWBackward.h
//  Phonegap-Push
//
//  Created by Anton Kaizer on 23/10/2018.
//
// Pushwoosh Push Notifications Plugin for Cordova iOS
// www.pushwoosh.com
// (c) Pushwoosh 2018
//
// MIT Licensed

#import <Foundation/Foundation.h>
#import <Cordova/CDV.h>

NS_ASSUME_NONNULL_BEGIN

@interface PWBackward : NSObject

//pgb uses cordova-ios@4.3.1 which does not contain colorFromColorString method
+ (UIColor*)colorFromColorString:(NSString*)colorString cordovaViewController:(CDVViewController *)viewController;

@end

NS_ASSUME_NONNULL_END
