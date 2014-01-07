//
//  PWAppOpenRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWAppOpenRequest.h"

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

@implementation PWAppOpenRequest

- (NSString *) methodName {
	return @"applicationOpen";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	return dict;
}

@end
