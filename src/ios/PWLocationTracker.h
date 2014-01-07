//
//  PWLocationTracker.h
//	Pushwoosh SDK
//

#import <CoreLocation/CoreLocation.h>

typedef void(^locationHandler)(CLLocation *location);

@interface PWLocationTracker : NSObject <CLLocationManagerDelegate>

@property (nonatomic, retain) CLLocationManager *locationManager;
@property (nonatomic, assign) BOOL enabled;
@property (nonatomic, copy) NSString *backgroundMode;
@property (nonatomic, assign) CLLocationDistance distanceToNearestGeoZone;
@property (nonatomic, assign) BOOL loggingEnabled;

@property (nonatomic, copy) locationHandler locationUpdatedInForeground;
@property (nonatomic, copy) locationHandler locationUpdatedInBackground;

@end
