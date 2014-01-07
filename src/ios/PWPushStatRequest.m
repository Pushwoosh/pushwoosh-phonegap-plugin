//
//  PWPushStatRequest
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWPushStatRequest.h"

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

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
