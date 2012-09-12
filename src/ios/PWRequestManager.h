//
//  PWRequestManager.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import <Foundation/Foundation.h>
#import "PWRequest.h"

#define kServiceAddress @"https://cp.pushwoosh.com/json/1.3/"

@interface PWRequestManager : NSObject

+ (PWRequestManager *) sharedManager;
- (BOOL) sendRequest: (PWRequest *) request;

@end
