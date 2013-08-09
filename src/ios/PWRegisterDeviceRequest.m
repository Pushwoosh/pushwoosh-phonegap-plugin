//
//  PWRegisterDeviceRequest
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRegisterDeviceRequest.h"
#import "PushNotificationManager.h"

@implementation PWRegisterDeviceRequest
@synthesize pushToken, language, timeZone;


- (NSString *) methodName {
	return @"registerDevice";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	
	[dict setObject:[NSNumber numberWithInt:1] forKey:@"device_type"];
	[dict setObject:pushToken forKey:@"push_token"];
	[dict setObject:language forKey:@"language"];
	[dict setObject:timeZone forKey:@"timezone"];

	BOOL sandbox = ![PushNotificationManager getAPSProductionStatus];
	if(sandbox)
		[dict setObject:@"sandbox" forKey:@"gateway"];
	else
		[dict setObject:@"production" forKey:@"gateway"];

	NSString * package = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"];
	[dict setObject:package forKey:@"package"];
	
	return dict;
}


@end
