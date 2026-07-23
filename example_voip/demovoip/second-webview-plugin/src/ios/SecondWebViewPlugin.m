#import <Cordova/CDVPlugin.h>
#import <Cordova/CDVPluginResult.h>
#import <WebKit/WebKit.h>

// Test harness (demo only, NOT part of the shipped plugin).
// Presents a plain WKWebView on top of the main Cordova WebView to reproduce the client
// scenario: a secondary native WebView shows the call UI while the main WebView is
// backgrounded (its JS suspended). VoIP events reach this screen via the
// PushwooshVoIPEventDispatched notification and are injected with window.__pushwooshDispatch.

@interface PWVideoCallWebViewController : UIViewController
@property (nonatomic, strong) WKWebView *webView;
@end

@implementation PWVideoCallWebViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = [UIColor blackColor];

    self.webView = [[WKWebView alloc] initWithFrame:self.view.bounds
                                      configuration:[WKWebViewConfiguration new]];
    self.webView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self.webView loadHTMLString:[self pageHTML] baseURL:nil];
    [self.view addSubview:self.webView];

    UIButton *closeBtn = [UIButton buttonWithType:UIButtonTypeSystem];
    [closeBtn setTitle:@"  ✕ Close  " forState:UIControlStateNormal];
    [closeBtn setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    closeBtn.backgroundColor = [UIColor colorWithWhite:0.0 alpha:0.6];
    closeBtn.layer.cornerRadius = 8.0;
    closeBtn.translatesAutoresizingMaskIntoConstraints = NO;
    [closeBtn addTarget:self action:@selector(closeTapped) forControlEvents:UIControlEventTouchUpInside];
    [self.view addSubview:closeBtn];
    [NSLayoutConstraint activateConstraints:@[
        [closeBtn.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:8.0],
        [closeBtn.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor constant:-12.0],
        [closeBtn.heightAnchor constraintEqualToConstant:40.0]
    ]];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onVoIPEvent:)
                                                 name:@"PushwooshVoIPEventDispatched"
                                               object:nil];
}

- (void)closeTapped {
    [self dismissViewControllerAnimated:YES completion:nil];
}

- (void)onVoIPEvent:(NSNotification *)note {
    NSString *name = note.userInfo[@"eventName"] ?: @"";
    NSDictionary *payload = note.userInfo[@"payload"] ?: @{};
    NSLog(@"[SecondWebView] VoIP event via notification: %@ payload: %@", name, payload);

    NSData *data = [NSJSONSerialization dataWithJSONObject:payload options:0 error:nil];
    NSString *json = data ? [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] : @"{}";
    NSString *js = [NSString stringWithFormat:@"window.__pushwooshDispatch('%@', %@);", name, json];

    dispatch_async(dispatch_get_main_queue(), ^{
        [self.webView evaluateJavaScript:js completionHandler:nil];
    });
}

- (NSString *)pageHTML {
    return
    @"<!DOCTYPE html><html><head>"
    @"<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
    @"<style>"
    @"body{font-family:-apple-system,sans-serif;background:#111;color:#eee;margin:0;padding:24px 20px;}"
    @"h2{color:#4da3ff;margin:0 0 6px;}"
    @".note{color:#aaa;font-size:13px;line-height:1.4;margin-bottom:16px;}"
    @"#log div{background:#1e1e1e;border-left:3px solid #4da3ff;padding:8px 10px;margin:6px 0;"
    @"font-family:ui-monospace,monospace;font-size:13px;white-space:pre-wrap;word-break:break-word;}"
    @".empty{color:#666;border-left-color:#444 !important;}"
    @"</style></head><body>"
    @"<h2>Secondary WebView (native WKWebView)</h2>"
    @"<div class='note'>Not a Cordova WebView. The main Cordova WebView is backgrounded behind this "
    @"screen, so its JS callbacks are suspended. VoIP events arrive here via the "
    @"PushwooshVoIPEventDispatched notification and are injected with window.__pushwooshDispatch.</div>"
    @"<div id='log'><div class='empty'>Waiting for VoIP events... answer or hang up a call.</div></div>"
    @"<script>"
    @"window.__pushwooshDispatch=function(name,payload){"
    @"var log=document.getElementById('log');"
    @"var empty=log.querySelector('.empty');if(empty){empty.remove();}"
    @"var row=document.createElement('div');"
    @"row.textContent='['+new Date().toLocaleTimeString()+'] '+name+': '+JSON.stringify(payload);"
    @"log.insertBefore(row,log.firstChild);};"
    @"</script></body></html>";
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end


@interface SecondWebViewPlugin : CDVPlugin
@property (nonatomic, strong) PWVideoCallWebViewController *videoCallVC;
@end

@implementation SecondWebViewPlugin

- (void)open:(CDVInvokedUrlCommand *)command {
    dispatch_async(dispatch_get_main_queue(), ^{
        self.videoCallVC = [PWVideoCallWebViewController new];
        self.videoCallVC.modalPresentationStyle = UIModalPresentationFullScreen;
        [self.viewController presentViewController:self.videoCallVC animated:YES completion:nil];

        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                    messageAsString:@"secondary WebView presented"];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    });
}

- (void)close:(CDVInvokedUrlCommand *)command {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.videoCallVC dismissViewControllerAnimated:YES completion:nil];
        self.videoCallVC = nil;

        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                    messageAsString:@"secondary WebView dismissed"];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    });
}

@end
