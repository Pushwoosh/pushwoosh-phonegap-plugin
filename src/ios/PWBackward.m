//
//  PWBackward.m
//  Phonegap-Push
//
//  Created by Anton Kaizer on 23/10/2018.
//
// Pushwoosh Push Notifications Plugin for Cordova iOS
// www.pushwoosh.com
// (c) Pushwoosh 2018
//
// MIT Licensed

#import "PWBackward.h"

@implementation PWBackward
    
+ (UIColor*)colorFromColorString:(NSString *)colorString cordovaViewController:(CDVViewController *)viewController {
    if ([viewController respondsToSelector:@selector(colorFromColorString:)]) {
        return [viewController performSelector:@selector(colorFromColorString:) withObject:colorString];
    } else {
        return [self colorFromColorString:colorString];
    }
}

+ (UIColor*)colorFromColorString:(NSString *)colorString {
    // Validate format
    if (!colorString ||
        [colorString rangeOfString:@"^(#[0-9A-F]{3}|(0x|#)([0-9A-F]{2})?[0-9A-F]{6})$" options:NSRegularExpressionSearch].location == NSNotFound) {
        return nil;
    }
    
    // Remove prefix
    colorString = [colorString substringFromIndex:[colorString hasPrefix:@"#"] ? 1 : 2];
    
    //convert to AARRGGBB format
    if (colorString.length == 3) { // #RGB
        unichar rgb[3];
        [colorString getCharacters:rgb];
        colorString = [NSString stringWithFormat:@"FF%C%C%C%C%C%C", rgb[0], rgb[0], rgb[1], rgb[1], rgb[2], rgb[2]];
    } else if (colorString.length == 6) { // RRGGBB
        colorString = [@"FF" stringByAppendingString:colorString];
    }

    // AARRGGBB to int
    unsigned colorInt = 0;
    [[NSScanner scannerWithString:colorString] scanHexInt:&colorInt];

    //int to UIColor
    CGFloat (^extractColor)(uint8_t) = ^(uint8_t byte){ return (CGFloat)(((colorInt >> (byte * 8)) & 0xFF) / 255.); };
    return [UIColor colorWithRed:extractColor(2) green:extractColor(1) blue:extractColor(0) alpha:extractColor(3)];
}
    
@end
