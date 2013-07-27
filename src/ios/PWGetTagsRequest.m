//
//  PWGetTagsRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWGetTagsRequest.h"

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
