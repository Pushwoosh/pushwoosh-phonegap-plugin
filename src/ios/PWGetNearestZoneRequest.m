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
	
	[dict setObject:[NSNumber numberWithDouble:coordinate.latitude] forKey:@"lat"];
	[dict setObject:[NSNumber numberWithDouble:coordinate.longitude] forKey:@"lng"];
	
	return dict;
}
@end
