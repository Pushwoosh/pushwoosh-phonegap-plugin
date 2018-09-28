//
//  PWIInboxStyle.h
//  PushwooshInboxUI
//
//  Created by Pushwoosh on 01/11/2017.
//  Copyright © 2017 Pushwoosh. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

typedef NSString * (^PWIDateFormatterBlock)(NSDate *date, NSObject *owner);

//! This class is designed to customize the Inbox appearance
@interface PWIInboxStyle : NSObject

//! This block customizes the date formatting
@property (nonatomic, readwrite) PWIDateFormatterBlock dateFormatterBlock;

//! The default icon in the cell next to the message; if not specified, the app icon is used
@property (nonatomic, readwrite) UIImage *defaultImageIcon;

//! The default font
@property (nonatomic, readwrite) UIFont *defaultFont;

//! The default text color
@property (nonatomic, readwrite) UIColor *defaultTextColor;

//! The default background color
@property (nonatomic, readwrite) UIColor *backgroundColor;

//! The default selection color
@property (nonatomic, readwrite) UIColor *selectionColor;

//! The appearance of the unread messages mark
@property (nonatomic, readwrite) UIImage *unreadImage;

//! The image which is displayed if an error occurs and the list of inbox messages is empty
@property (nonatomic, readwrite) UIImage *listErrorImage;

//! The error text which is displayed when an error occurs; cannot be localized
@property (nonatomic, readwrite) NSString *listErrorMessage;

//! The image which is displayed if the list of inbox messages is empty
@property (nonatomic, readwrite) UIImage *listEmptyImage;

//! The text which is displayed if the list of inbox messages is empty; cannot be localized
@property (nonatomic, readwrite) NSString *listEmptyMessage;

//! The accent color
@property (nonatomic, readwrite) UIColor *accentColor;

//! The color of message titles
@property (nonatomic, readwrite) UIColor *titleColor;

//! The color of messages descriptions
@property (nonatomic, readwrite) UIColor *descriptionColor;

//! The color of message dates
@property (nonatomic, readwrite) UIColor *dateColor;

//! The color of the separator
@property (nonatomic, readwrite) UIColor *separatorColor;

//! The font of message titles
@property (nonatomic, readwrite) UIFont *titleFont;

//! The font of message descriptions
@property (nonatomic, readwrite) UIFont *descriptionFont;

//! The font of message dates
@property (nonatomic, readwrite) UIFont *dateFont;

//! The default bar color
@property (nonatomic, readwrite) UIColor *barBackgroundColor;

//! The default back button color
@property(nonatomic, readwrite) UIColor *barAccentColor;

//! The default bar accent color
@property (nonatomic, readwrite) UIColor *barTextColor;

//! The default bar title text
@property (nonatomic, readwrite) NSString *barTitle;

/**
 The method returning the default style; all parameters might be changed
 
 @retutn instance of default style
 */
+ (instancetype)defaultStyle;

/**
 This method updates the default style for PWInboxViewController
 
 @param style the new default style for PWInboxViewController
 */
+ (void)setupDefaultStyle:(PWIInboxStyle *)style;

/**
 The method filling style's fields based on following parameters: icon, textColor, accentColor, date; all parameters might be changed
 */
+ (instancetype)customStyleWithDefaultImageIcon:(UIImage *)icon
                                      textColor:(UIColor *)textColor
                                    accentColor:(UIColor *)accentColor
                                           font:(UIFont *)font;
/**
 The method filling style's fields based on following parameters: icon, textColor, accentColor, font, dateFormatterBlock; all parameters might be changed
 */
+ (instancetype)customStyleWithDefaultImageIcon:(UIImage *)icon
                                      textColor:(UIColor *)textColor
                                    accentColor:(UIColor *)accentColor
                                           font:(UIFont *)font
                             dateFromatterBlock:(PWIDateFormatterBlock)dateFormatterBlock;
                             
@end
