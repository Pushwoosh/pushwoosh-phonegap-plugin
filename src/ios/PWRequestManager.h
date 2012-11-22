//
//  PWRequestManager.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import <Foundation/Foundation.h>
#import "PWRequest.h"

#define kServiceAddressSSL @"https://cp.pushwoosh.com/json/1.3/"
#define kServiceAddressNoSSL @"http://cp.pushwoosh.com/json/1.3/"

@interface PWRequestManager : NSObject

+ (PWRequestManager *) sharedManager;
- (BOOL) sendRequest: (PWRequest *) request;
- (BOOL) sendRequest: (PWRequest *) request error:(NSError **)error;

@end
