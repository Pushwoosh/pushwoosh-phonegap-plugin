//
//  PWLocationTracker.h
//	Pushwoosh SDK
//

#import <CoreLocation/CoreLocation.h>

#define kPWTrackingDisabled @"PWTrackingDisabled"
#define kPWTrackSignificantLocationChanges @"PWTrackSignificantLocationChanges"
#define kPWTrackAccurateLocationChanges @"PWTrackAccurateLocationChanges"

typedef void(^locationHandler)(CLLocation *location);

@interface PWLocationTracker : NSObject <CLLocationManagerDelegate>

@property (nonatomic, retain) CLLocationManager *locationManager;
@property (nonatomic, assign) BOOL enabled;
@property (nonatomic, copy) NSString *backgroundMode;

@property (nonatomic, copy) locationHandler locationUpdatedInForeground;
@property (nonatomic, copy) locationHandler locationUpdatedInBackground;

@end
