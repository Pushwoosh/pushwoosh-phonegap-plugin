//
//  PWPushStatRequest
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWPushStatRequest.h"

@implementation PWPushStatRequest
@synthesize hash;

- (NSString *) methodName {
	return @"pushStat";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	
	if(hash != nil)
		[dict setObject:hash forKey:@"hash"];
	
	return dict;
}


@end
