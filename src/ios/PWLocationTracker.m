//
//  PWLocationTracker.m
//  Pushwoosh SDK
//

#import "PWLocationTracker.h"
#define kRegionIdentifier @"com.pushwoosh.regionForTracking"

#define kMaximumGeozoneRadius 100
#define kDistanceFilterInBackground 100

#define LOCATIONS_FILE @"PWLocationTracking"
#define LOCATIONS_FILE_TYPE @"log"

//comment this line to disable location tracking for geo-push notifications and dependency on CoreLocation.framework
#define USE_LOCATION

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

static CGFloat const kMinUpdateDistance = 10.f;
static NSTimeInterval const kMinUpdateTime = 10.f;

@interface PWLocationTracker () {
    BOOL _locationServiceEnabledInBG, _precisionTrackingEnabled;
    UIBackgroundTaskIdentifier _regionMonitoringBGTask;
}

@property (nonatomic, retain) CLLocation *previosLocation;

@end

@implementation PWLocationTracker

#pragma mark - Setup

- (id)init {
    if (self = [super init]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationDidBecomeActive) name:UIApplicationDidBecomeActiveNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationDidEnterBackground) name:UIApplicationDidEnterBackgroundNotification object:nil];

#ifdef USE_LOCATION
        self.locationManager = [[CLLocationManager alloc] init];
        self.locationManager.delegate = self;
        
        NSArray * bgModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
        _locationServiceEnabledInBG = NO;
        
        if ([bgModes count]) {
            for (NSString *value in bgModes) {
                if (value && [value isKindOfClass:[NSString class]]) {
                    if ([value isEqualToString:@"location"]) {
                        _locationServiceEnabledInBG = YES;
                        break;
                    }
                }
            }
        }
#endif
    }
    
    return self;
}

#pragma mark - Notification handlers

- (void)applicationDidBecomeActive {
	[self updateLocationTrackingMode];
}

- (void)applicationDidEnterBackground {
	[self updateLocationTrackingMode];
}

#pragma mark -
#pragma mark -

- (void)setDistanceToNearestGeoZone:(CLLocationDistance)distanceToNearestGeoZone {
    _distanceToNearestGeoZone = distanceToNearestGeoZone;
    
    CLLocationAccuracy accuracy;
    
    if (_distanceToNearestGeoZone > 10000.f) {
        accuracy = kCLLocationAccuracyThreeKilometers;
    }
    else if (_distanceToNearestGeoZone > 1000.f) {
        accuracy = kCLLocationAccuracyHundredMeters;
    }
    else {
        accuracy = kCLLocationAccuracyBest;
    }
    
    [self.locationManager setDesiredAccuracy:accuracy];
}

- (void)setEnabled:(BOOL)enabled {
    _enabled = enabled;
    [self updateLocationTrackingMode];
}

- (void)stopUpdatingLocation {
    _precisionTrackingEnabled = NO;
    [self.locationManager stopUpdatingLocation];
    [self.locationManager stopMonitoringSignificantLocationChanges];
    [self stopRegionMonitoring];
}

- (void)updateLocationTrackingMode {
    [self stopUpdatingLocation];
	
	if(!_enabled)
		return;
    
    if ([self isInBackground]) {
        if (_locationServiceEnabledInBG) {
            [self startPreciseGeoTracking];
        }
        
        [self startApproximateGeoTracking];
	}
	else {
        [self startPreciseGeoTracking];
	}
}

- (void)startPreciseGeoTracking {
    if (![self locationServiceAuthorized])
        return;
    
    if ([CLLocationManager locationServicesEnabled]) {
        _precisionTrackingEnabled = YES;
        [self.locationManager startUpdatingLocation];
    }
    else {
        [self log:@"Location services not enabled on this device"];
    }
}

- (void)startApproximateGeoTracking {
    if (![self locationServiceAuthorized])
        return;
    
    _regionMonitoringBGTask = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler: ^{
        [[UIApplication sharedApplication] endBackgroundTask:_regionMonitoringBGTask];
        _regionMonitoringBGTask = UIBackgroundTaskInvalid;
    }];
    
    BOOL geoFencingEnabled = NO;
    
    if (NSFoundationVersionNumber > NSFoundationVersionNumber_iOS_6_1) {
        if ([CLLocationManager isMonitoringAvailableForClass:[CLCircularRegion class]]) {
            geoFencingEnabled = YES;
        }
    }
    else {
        if ([CLLocationManager regionMonitoringAvailable]) {
            geoFencingEnabled = YES;
        }
    }
    
    if (geoFencingEnabled) {
        CLLocation *location = [_locationManager location];
        
        if (!location) {
            location = self.previosLocation;
        }
        
        CLLocationCoordinate2D center = location.coordinate;
        CLLocationDistance regionRadius = _distanceToNearestGeoZone - kMaximumGeozoneRadius;
        
        if (regionRadius > _locationManager.maximumRegionMonitoringDistance) {
            regionRadius = _locationManager.maximumRegionMonitoringDistance;
        }
        
        if (regionRadius < kDistanceFilterInBackground) {
            regionRadius = kDistanceFilterInBackground;
        }
        
        CLRegion *region = nil;
        
        if (NSFoundationVersionNumber > NSFoundationVersionNumber_iOS_6_1) {
            region = [[CLCircularRegion alloc] initWithCenter:center
                                                       radius:regionRadius
                                                   identifier:kRegionIdentifier];
        }
        else {
            region = [[CLRegion alloc] initCircularRegionWithCenter:center
                                                             radius:regionRadius
                                                         identifier:kRegionIdentifier];
        }
        
        [self log:[NSString stringWithFormat:@"Attempt to start region monitoring: <%+.6f, %+.6f> radius %.0fm", region.center.latitude, region.center.longitude, region.radius]];
        
        if (NSFoundationVersionNumber > NSFoundationVersionNumber_iOS_4_3) {
            [_locationManager startMonitoringForRegion:region];
        }
        else {
            [_locationManager startMonitoringForRegion:region desiredAccuracy:kCLLocationAccuracyBest];
        }
    }
    else {
        [self log:@"Geofencing not available on this device"];
    }
    
    [self startSignificantMonitoring];
}

- (void)startSignificantMonitoring {
    if ([CLLocationManager significantLocationChangeMonitoringAvailable]) {
        [_locationManager startMonitoringSignificantLocationChanges];
        [self log:@"Start monitoring significant changes"];
    }
    else {
        [self log:@"Significant changes service not available on this device"];
    }
}

- (void)stopRegionMonitoring {
    NSSet *regions = [_locationManager monitoredRegions];
    
    for (CLRegion *region in regions) {
        if ([region.identifier isEqualToString:kRegionIdentifier]) {
            [_locationManager stopMonitoringForRegion:region];
            [self log:[NSString stringWithFormat:@"Stop monitoring region: <%+.6f, %+.6f> radius %.0fm", region.center.latitude, region.center.longitude, region.radius]];
        }
    }
}

- (BOOL)locationServiceAuthorized {
    BOOL result = ([CLLocationManager authorizationStatus] != kCLAuthorizationStatusDenied && [CLLocationManager authorizationStatus] != kCLAuthorizationStatusRestricted);
    
    if (!result) {
        [self log:@"Please authorize app for using location services"];
    }
    
    return result;
}

- (BOOL)isInBackground {
    return [UIApplication sharedApplication].applicationState == UIApplicationStateBackground;
}

#pragma mark -
#pragma mark - Logging

- (void)log:(NSString *)message {
    NSLog(@"Location Tracker:\n%@\n---------------------------", message);
    
    if (!_loggingEnabled) {
        return;
    }
    
    NSArray *paths = NSSearchPathForDirectoriesInDomains (NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *documentsDirectory = [paths objectAtIndex:0];
    NSString *path = [NSString stringWithFormat:@"%@/%@.%@", documentsDirectory, LOCATIONS_FILE, LOCATIONS_FILE_TYPE];
    
    if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
        NSLog(@"Creating locations log file");
        NSDate *date = [NSDate date];
        NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
        [dateFormat setDateFormat:@"yyyy/MM/dd hh:mm aaa"];
        NSString *content = [NSString stringWithFormat:@"Location Tracker Log (%@)\n------------------------------------------------------------------\n", [dateFormat stringFromDate:date]];
        [content writeToFile:path
                  atomically:NO
                    encoding:NSStringEncodingConversionAllowLossy
                       error:nil];
        NSLog(@"Path to location file: %@", path);
    }
    
    message = [message stringByAppendingString:@"\n"];
    
    NSFileHandle *file = [NSFileHandle fileHandleForUpdatingAtPath:path];
    NSData *data = [message dataUsingEncoding:NSUTF8StringEncoding];
    [file seekToEndOfFile];
    [file writeData: data];
    [file closeFile];
}

- (void)reportLocation:(CLLocation *)location withMessage:(NSString *)message {
    NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
    [dateFormat setDateFormat:@"hh:mmaa"];
    
    NSString *msg = [NSString stringWithFormat:@"%@: %@ <%+.6f, %+.6f> (+/-%.0fm) %.1fkm/h",
                     message,
                     [dateFormat stringFromDate:location.timestamp],
                     location.coordinate.latitude,
                     location.coordinate.longitude,
                     location.horizontalAccuracy,
                     location.speed * 3.6];
    
    if (location.altitude > 0) {
        msg = [NSString stringWithFormat:@"%@ alt: %.2fm (+/-%.0fm)",
               msg,
               location.altitude,
               location.verticalAccuracy];
    }
    
    [self log:msg];
}

#pragma mark - CLLocationManager Delegate

- (void)locationManager:(CLLocationManager *)manager didStartMonitoringForRegion:(CLRegion *)region {
    [self log:[NSString stringWithFormat:@"Region monitoring did start: <%+.6f, %+.6f> radius %.0fm", region.center.latitude, region.center.longitude, region.radius]];
    
    if (_regionMonitoringBGTask != UIBackgroundTaskInvalid) {
        [[UIApplication sharedApplication] endBackgroundTask:_regionMonitoringBGTask];
        _regionMonitoringBGTask = UIBackgroundTaskInvalid;
    }
}

- (void)locationManager:(CLLocationManager *)manager monitoringDidFailForRegion:(CLRegion *)region withError:(NSError *)error {
    [self log:[NSString stringWithFormat:@"Region monitoring did failed: %@", error.localizedDescription]];
    
    if (_regionMonitoringBGTask != UIBackgroundTaskInvalid) {
        [[UIApplication sharedApplication] endBackgroundTask:_regionMonitoringBGTask];
        _regionMonitoringBGTask = UIBackgroundTaskInvalid;
    }
}

- (void)updateLocation:(CLLocation *)newLocation {
    if (_previosLocation && ([newLocation.timestamp timeIntervalSinceDate:_previosLocation.timestamp] < kMinUpdateTime || [newLocation distanceFromLocation:_previosLocation] > kMinUpdateDistance)) {
        return;
    }
    
    self.previosLocation = newLocation;
    [self sendLocation:newLocation];
}

- (void)sendLocation:(CLLocation *)newLocation {
    [self reportLocation:newLocation withMessage:@"Send location"];
    
    if ([self isInBackground]) {
        if (self.locationUpdatedInBackground) {
			dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0ul), ^{
				UIBackgroundTaskIdentifier __block bgTask = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler: ^{
					[[UIApplication sharedApplication] endBackgroundTask:bgTask];
					bgTask = UIBackgroundTaskInvalid;
				}];
                
				self.locationUpdatedInBackground(newLocation);
                
				if (bgTask != UIBackgroundTaskInvalid) {
					[[UIApplication sharedApplication] endBackgroundTask:bgTask];
					bgTask = UIBackgroundTaskInvalid;
				}
			});
        }
    } else {
        if (self.locationUpdatedInForeground) {
			dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0ul), ^{
				self.locationUpdatedInForeground(newLocation);
			});
        }
    }
}

- (void)locationManager:(CLLocationManager *)manager didEnterRegion:(CLRegion *)region {
    [_locationManager startMonitoringForRegion:region desiredAccuracy:kCLLocationAccuracyBest];
}

- (void)locationManager:(CLLocationManager *)manager didExitRegion:(CLRegion *)region {
    CLLocation *location = [[CLLocation alloc] initWithLatitude:region.center.latitude longitude:region.center.longitude];
    [self reportLocation:location withMessage:@"Exit region"];
    [self sendLocation:[manager location]];
    [self startApproximateGeoTracking];
}

- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation {
    [self updateLocation:newLocation];
}

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray *)locations {
    if ([locations count]) {
        [self updateLocation:[locations lastObject]];
    }
}

#pragma mark -
#pragma mark - Teardown

- (void)dealloc {
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	[self stopUpdatingLocation];
	self.locationManager.delegate = nil;
	self.locationManager = nil;
}

@end
