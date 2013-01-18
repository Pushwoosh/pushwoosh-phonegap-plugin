//
//  HtmlWebViewController.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import <UIKit/UIKit.h>

typedef enum enumHtmlPageSupportedOrientations {
	PWOrientationPortrait = 1 << 0,
	PWOrientationPortraitUpsideDown = 1 << 1,
	PWOrientationLandscapeLeft = 1 << 2,
	PWOrientationLandscapeRight = 1 << 3,
} PWSupportedOrientations;

@class HtmlWebViewController;

@protocol HtmlWebViewControllerDelegate <NSObject>
- (void) htmlWebViewControllerDidClose: (HtmlWebViewController *) viewController;
@end

@interface HtmlWebViewController : UIViewController <UIWebViewDelegate> {
	UIWebView *webview;
	UIActivityIndicatorView *activityIndicator;
	
	int webViewLoads;
	NSString *urlToLoad;
}

- (id)initWithURLString:(NSString *)url;	//this method is to use it as a standalone webview

@property (nonatomic, unsafe_unretained) id <HtmlWebViewControllerDelegate> delegate;
@property (nonatomic, strong) IBOutlet UIWebView *webview;
@property (nonatomic, strong) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (nonatomic, assign) PWSupportedOrientations supportedOrientations;

@end
