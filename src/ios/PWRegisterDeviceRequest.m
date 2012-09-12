//
//  PWRegisterDeviceRequest
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRegisterDeviceRequest.h"

@implementation PWRegisterDeviceRequest
@synthesize pushToken, language, timeZone;


- (NSString *) methodName {
	return @"registerDevice";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	
	[dict setObject:[self encodeInt:1] forKey:@"device_type"];
	[dict setObject:[self encodeString:pushToken] forKey:@"push_token"];
	[dict setObject:[self encodeString:language] forKey:@"language"];
	[dict setObject:[self encodeString:timeZone] forKey:@"timezone"];

	return dict;
}

- (void) dealloc {
	self.pushToken = nil;
	self.language = nil;
	self.timeZone = nil;

	[super dealloc];
}

@end
