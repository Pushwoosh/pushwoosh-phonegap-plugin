//
//  PWPushStatRequest
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWPushStatRequest.h"

@implementation PWPushStatRequest

- (NSString *) methodName {
	return @"pushStat";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	return dict;
}

- (void) dealloc {
	[super dealloc];
}

@end
