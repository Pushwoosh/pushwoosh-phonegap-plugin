//
//  PWApplicationEventRequest
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWApplicationEventRequest.h"

@implementation PWApplicationEventRequest
@synthesize goal, count;

- (NSString *) methodName {
	return @"applicationEvent";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	
	[dict setObject:[self encodeString:goal] forKey:@"goal"];
	
	if(count != nil)
		[dict setObject:[self encodeInt:[count intValue]] forKey:@"count"];
	
	return dict;
}

- (void) dealloc {
	self.goal = nil;
	self.count = nil;
	[super dealloc];
}

@end
