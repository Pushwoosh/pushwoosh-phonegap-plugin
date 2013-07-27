//
//  PWLocationTracker.m
//  Pushwoosh SDK
//

#import "PWLocationTracker.h"
#import <UIKit/UIKit.h>

//comment this line to disable location tracking for geo-push notifications and dependency on CoreLocation.framework
#define USE_LOCATION

static CGFloat const kMinUpdateDistance = 10.f;
static NSTimeInterval const kMinUpdateTime = 10.f;

@interface PWLocationTracker () {
@private     
	BOOL isEnabled;
}

@end

@implementation PWLocationTracker

#pragma mark - NSObject

- (id)init {
    if (self = [super init]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationDidBecomeActive) name:UIApplicationDidBecomeActiveNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationDidEnterBackground) name:UIApplicationDidEnterBackgroundNotification object:nil];

#ifdef USE_LOCATION
        self.locationManager = [[CLLocationManager alloc] init];
        self.locationManager.delegate = self;
#endif
		//[self.locationManager setDesiredAccuracy:kCLLocationAccuracyHundredMeters];

		self.enabled = false;
    }
    return self;
}

- (void)dealloc {
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	[self stopUpdatingLocation];
	
	self.locationManager.delegate = nil;
	self.locationManager = nil;
	
	[super dealloc];
}

#pragma mark - Notification handlers

- (void)applicationDidBecomeActive {
	[self updateLocationTrackingMode];
}

- (void)applicationDidEnterBackground {
	[self updateLocationTrackingMode];
}

#pragma mark - Public

- (BOOL) getEnabled {
	return isEnabled;
}

- (void) setEnabled:(BOOL)enabled {
	isEnabled = enabled;
	[self updateLocationTrackingMode];
}

- (void)updateLocationTrackingMode {
    [self stopUpdatingLocation];
	
	if(!isEnabled)
		return;
	
    if([self isInBackground]) {
		if ([self.backgroundMode isEqualToString:kPWTrackSignificantLocationChanges]) {
			[self.locationManager startMonitoringSignificantLocationChanges];
		} else if ([self.backgroundMode isEqualToString:kPWTrackAccurateLocationChanges]) {
			[self.locationManager startUpdatingLocation];
		}
	}
	else {
		[self.locationManager startUpdatingLocation];
	}
}

- (void)stopUpdatingLocation {
    [self.locationManager stopUpdatingLocation];
    [self.locationManager stopMonitoringSignificantLocationChanges];
}

#pragma mark - Private

- (BOOL)isInBackground {
    return [UIApplication sharedApplication].applicationState == UIApplicationStateBackground;
}

#pragma mark - CLLocationManager Delegate

- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation {
    if (oldLocation && ([newLocation.timestamp timeIntervalSinceDate:oldLocation.timestamp] < kMinUpdateTime ||
                        [newLocation distanceFromLocation:oldLocation] < kMinUpdateDistance)) {
        return;
    }
    
    if ([self isInBackground]) {
        if (self.locationUpdatedInBackground) {
			dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0ul);
			dispatch_async(queue, ^{
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
			dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0ul);
			dispatch_async(queue, ^{
				self.locationUpdatedInForeground(newLocation);
			});
        }
    }
}

@end
