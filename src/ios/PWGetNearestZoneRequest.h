//
//  PWGetNearestZoneRequest.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRequest.h"
#import <CoreLocation/CoreLocation.h>
@interface PWGetNearestZoneRequest : PWRequest

@property CLLocationCoordinate2D coordinate;

@end
