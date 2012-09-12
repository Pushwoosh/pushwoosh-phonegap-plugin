//
//  PWRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRequest.h"

@implementation PWRequest
@synthesize appId, hwid;

- (NSString *) methodName {
	return @"";
}

//Please note that all values will be processed as strings
- (NSDictionary *) requestDictionary {
	return nil;
}

- (NSString *) encodeString: (NSString *) str { 
	return [NSString stringWithFormat:@"\"%@\"", [str stringByReplacingOccurrencesOfString:@"\"" withString:@"\\\""]];
}

- (NSString *) encodeNumber: (NSNumber *) number {
	return [number stringValue];
}

- (NSString *) encodeObject: (NSObject *) object {
	return [NSString stringWithFormat:@"%@", object];
}

- (NSString *) encodeInt: (int) number {
	return [NSString stringWithFormat:@"%d", number];
}

- (NSString *) encodeDouble: (double) number {
	return [NSString stringWithFormat:@"%f", number];
}

- (NSString *) encodeFloat: (float) number {
	return [NSString stringWithFormat:@"%f", number];
}

- (NSMutableDictionary *) baseDictionary {
	NSMutableDictionary *dict = [NSMutableDictionary new];
	[dict setObject:[self encodeString:appId] forKey:@"application"];
	[dict setObject:[self encodeString:hwid] forKey:@"hwid"];
	return [dict autorelease];
}

- (void) dealloc {
	self.appId = nil;
	self.hwid = nil;
	
	[super dealloc];
}

@end
