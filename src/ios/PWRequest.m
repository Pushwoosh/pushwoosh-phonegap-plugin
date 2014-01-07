//
//  PWRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRequest.h"

#define kSDKVersion @"2.0"

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

@implementation PWRequest
@synthesize appId, hwid;

- (NSString *) methodName {
	return @"";
}

//Please note that all values will be processed as strings
- (NSDictionary *) requestDictionary {
	return nil;
}

- (NSMutableDictionary *) baseDictionary {
	NSMutableDictionary *dict = [NSMutableDictionary new];
	[dict setObject:appId forKey:@"application"];
	[dict setObject:hwid forKey:@"hwid"];
	[dict setObject:kSDKVersion forKey:@"v"];
	return dict;
}

- (void) parseResponse: (NSDictionary *) response {
}

@end
