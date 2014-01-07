//
//  PWSetTagsRequest.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWSetTagsRequest.h"
#import "PW_SBJsonWriter.h"

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

@implementation PWSetTagsRequest
@synthesize tags;

- (NSString *) methodName {
	return @"setTags";
}

- (NSDictionary *) requestDictionary {
	NSMutableDictionary *dict = [self baseDictionary];
	NSMutableDictionary *mutableTags = [tags mutableCopy];
	
	for (NSString *key in [mutableTags allKeys]) {
		NSString *valueString = @"";
		NSObject *value = [mutableTags objectForKey:key];
		
		if ([value isKindOfClass:[NSString class]]) {
			valueString = (NSString *)value;
			
			if([valueString hasPrefix:@"#pwinc#"]) {
				NSString * noPrefixString = [valueString substringFromIndex:7];
				NSNumber * valueNumber = [NSNumber numberWithDouble:[noPrefixString doubleValue]];
				
				NSMutableDictionary *opTag = [NSMutableDictionary dictionaryWithObjectsAndKeys:@"increment", @"operation", valueNumber, @"value", nil];
				[mutableTags setObject:opTag forKey:key];
			}
		}
	}

	[dict setObject:mutableTags forKey:@"tags"];
	return dict;
}

@end
