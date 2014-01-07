//
//  PWGetNearestZoneRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWGetNearestZoneRequest.h"

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

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

- (void)parseResponse:(NSDictionary *)response {
    self.distance = -1;
    
    if (response && [response isKindOfClass:[NSDictionary class]]) {
        NSDictionary *responseDict = [response objectForKey:@"response"];
        
        if (responseDict && [responseDict isKindOfClass:[NSDictionary class]]) {
            NSNumber *distance = [responseDict objectForKey:@"distance"];
            if (distance && [distance isKindOfClass:[NSNumber class]]) {
                self.distance = [distance doubleValue];
            }
        }
    }
}

@end
