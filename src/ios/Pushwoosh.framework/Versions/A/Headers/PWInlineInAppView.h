//
//  PWInlineInAppView.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2018
//

#import <UIKit/UIKit.h>

@class PWInlineInAppView;

@protocol PWInlineInAppViewDelegate <NSObject>

@optional
- (void)inlineInAppDidLoadInView:(PWInlineInAppView *)inAppView;
- (void)didCloseInlineInAppView:(PWInlineInAppView *)inAppView;
- (void)didChangeSizeOfInlineInAppView:(PWInlineInAppView *)inAppView;

@end

@interface PWInlineInAppView : UIView

@property (nonatomic) IBInspectable NSString *identifier;

@property (nonatomic, weak) id <PWInlineInAppViewDelegate> delegate;

@end
