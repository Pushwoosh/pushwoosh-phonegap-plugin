//
//  PWRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRequest.h"

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
	return [dict autorelease];
}

- (void) parseResponse: (NSDictionary *) response {
}

- (void) dealloc {
	self.appId = nil;
	self.hwid = nil;
	
	[super dealloc];
}

@end
