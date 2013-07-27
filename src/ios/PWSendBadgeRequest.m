//
//  PWSendBadgeRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWSendBadgeRequest.h"

@implementation PWSendBadgeRequest
@synthesize badge;

- (NSString *) methodName {
	return @"setBadge";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	
	[dict setObject:[NSNumber numberWithInt:badge] forKey:@"badge"];
	
	return dict;
}

@end
