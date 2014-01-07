//
//  PWUnregisterDeviceRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2013
//


#import "PWUnregisterDeviceRequest.h"

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

@implementation PWUnregisterDeviceRequest

- (NSString *) methodName {
	return @"unregisterDevice";
}

- (NSDictionary *) requestDictionary {
	return [self baseDictionary];
}

@end
