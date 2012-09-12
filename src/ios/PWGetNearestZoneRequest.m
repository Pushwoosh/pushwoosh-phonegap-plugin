//
//  PWGetNearestZoneRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWGetNearestZoneRequest.h"

@implementation PWGetNearestZoneRequest
@synthesize coordinate;

- (NSString *) methodName {
	return @"getNearestZone";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	
	[dict setObject:[self encodeDouble:coordinate.latitude] forKey:@"lat"];
	[dict setObject:[self encodeDouble:coordinate.longitude] forKey:@"lng"];
	
	return dict;
}
@end
