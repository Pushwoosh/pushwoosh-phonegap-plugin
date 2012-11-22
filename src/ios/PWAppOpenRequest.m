//
//  PWAppOpenRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWAppOpenRequest.h"

@implementation PWAppOpenRequest

- (NSString *) methodName {
	return @"applicationOpen";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	return dict;
}

@end
