//
//  HtmlWebViewController.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "HtmlWebViewController.h"
#import <QuartzCore/QuartzCore.h>
#import "PushNotificationManager.h"

@implementation HtmlWebViewController

@synthesize webview, activityIndicator;
@synthesize supportedOrientations;
@synthesize delegate;

- (id)initWithURLString:(NSString *)url {
	if(self = [super init]) {
		urlToLoad = url;
		webViewLoads = 0;
	}
	
	return self;
}

- (void)viewDidLoad {
	[super viewDidLoad];
	
	self.title = @"";
	webViewLoads = 0;
	
	webview = [[UIWebView alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, self.view.frame.size.height)];
	webview.delegate = self;
	webview.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
	[self.view addSubview:webview];

	UIButton *closeButton = [UIButton buttonWithType:UIButtonTypeCustom];
	closeButton.frame = CGRectMake(self.view.frame.size.width - 33.0f, -11.0f, 44.0f, 44.0f);
	closeButton.autoresizingMask = UIViewAutoresizingFlexibleBottomMargin | UIViewAutoresizingFlexibleLeftMargin;
	[closeButton addTarget:self action:@selector(closeButtonAction) forControlEvents:UIControlEventTouchUpInside];
	closeButton.titleLabel.font = [UIFont fontWithName:@"AppleColorEmoji" size:22.0f];
	[closeButton setTitle:@"❎" forState:UIControlStateNormal];
	[self.view addSubview:closeButton];
	
	webview.opaque = YES;
	webview.scalesPageToFit = NO;
	
	webview.layer.cornerRadius = 10.0;
	[webview.layer setMasksToBounds:YES];
	webview.layer.backgroundColor = [[UIColor clearColor] colorWithAlphaComponent:0.60].CGColor;
	webview.layer.borderColor = [UIColor whiteColor].CGColor;
	webview.layer.borderWidth = 1.1;
	
	[webview loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:urlToLoad]]];
}

- (void)dealloc {
	self.delegate = nil;
	webview.delegate = nil;
}

- (void) closeButtonAction {
	if ([self.delegate respondsToSelector:@selector(htmlWebViewControllerDidClose:)])
		[self.delegate htmlWebViewControllerDidClose:self];
}

- (BOOL) shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation {
	if ((toInterfaceOrientation == UIInterfaceOrientationPortrait && (supportedOrientations & PWOrientationPortrait)) ||
		(toInterfaceOrientation == UIInterfaceOrientationPortrait && (supportedOrientations & PWOrientationPortraitUpsideDown)) ||
		(toInterfaceOrientation == UIInterfaceOrientationLandscapeLeft && (supportedOrientations & PWOrientationLandscapeLeft)) || 
		(toInterfaceOrientation == UIInterfaceOrientationLandscapeRight && (supportedOrientations & PWOrientationLandscapeRight))) {
		return YES;
	}
	return NO;
}

- (void)webViewDidStartLoad:(UIWebView *)webView {
	[UIApplication sharedApplication].networkActivityIndicatorVisible = YES;
	webViewLoads++;
}

- (void)webViewDidFinishLoad:(UIWebView *)webView {
	webViewLoads--;
	
	if(webViewLoads == 0) {
		[UIApplication sharedApplication].networkActivityIndicatorVisible = NO;
		
		//webview is visible and shouldn't be showed anymore
		webViewLoads = 1000;
		[[PushNotificationManager pushManager] showWebView];
	}
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error {
	webViewLoads--;
	
	if ([error code] != -999) {
		[UIApplication sharedApplication].networkActivityIndicatorVisible = NO;
	}
}

- (BOOL) webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType {
	if (navigationType == UIWebViewNavigationTypeLinkClicked) {
		[[UIApplication sharedApplication] openURL:[request URL]];
		
		//close the webview
		[self closeButtonAction];
		return NO;
	}
	
	return YES;
}

@end
