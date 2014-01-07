//
//  PWApplicationEventRequest
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWApplicationEventRequest.h"

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

@implementation PWApplicationEventRequest
@synthesize goal, count;

- (NSString *) methodName {
	return @"applicationEvent";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	
	[dict setObject:goal forKey:@"goal"];
	
	if(count != nil)
		[dict setObject:count forKey:@"count"];
	
	return dict;
}

@end
