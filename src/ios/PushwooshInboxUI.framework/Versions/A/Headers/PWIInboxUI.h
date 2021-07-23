//
//  PWIInboxUI.h
//  PushwooshInboxUI
//
//  Created by Pushwoosh on 01/11/2017.
//  Copyright © 2017 Pushwoosh. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@protocol PWInboxMessageProtocol;

@interface PWIInboxViewController : UIViewController

@property (nonatomic) void (^onMessageClickBlock)(id<PWInboxMessageProtocol> message);

/**
 Reloads everything from scratch.
 */
- (void)reloadData;
- (instancetype)init NS_UNAVAILABLE;

@end

@class PWIInboxStyle;
@interface PWIInboxUI : NSObject

/**
 @return PWIInboxViewController with a specified style
 */
+ (PWIInboxViewController *)createInboxControllerWithStyle:(PWIInboxStyle *)style;

/**
 @return PWIInboxViewController with a specified style and height of table view
 */
+ (PWIInboxViewController *)createInboxControllerWithStyle:(PWIInboxStyle *)style andContentHeight:(CGFloat)contentHeight;

@end
