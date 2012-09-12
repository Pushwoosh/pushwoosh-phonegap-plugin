//
//  PWRequest.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import <Foundation/Foundation.h>

@interface PWRequest : NSObject


@property (nonatomic, copy) NSString *appId;
@property (nonatomic, copy) NSString *hwid;

- (NSString *) methodName;
- (NSDictionary *) requestDictionary; //Please note that all values will be processed as strings


- (NSString *) encodeString: (NSString *) str;
- (NSString *) encodeNumber: (NSNumber *) number;
- (NSString *) encodeObject: (NSObject *) object;
- (NSString *) encodeInt: (int) number;
- (NSString *) encodeDouble: (double) number;
- (NSString *) encodeFloat: (float) number;

- (NSMutableDictionary *) baseDictionary;

@end
