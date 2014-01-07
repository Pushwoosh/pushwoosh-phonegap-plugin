//
//  PWGetTagsRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWGetTagsRequest.h"

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

@implementation PWGetTagsRequest

- (NSString *) methodName {
	return @"getTags";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	return dict;
}

- (void) parseResponse: (NSDictionary *) response {
	self.tags = [[response objectForKey:@"response"] objectForKey:@"result"];
}

@end
