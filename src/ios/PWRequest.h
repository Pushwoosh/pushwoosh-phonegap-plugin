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
- (NSDictionary *) requestDictionary;

- (NSMutableDictionary *) baseDictionary;
- (void) parseResponse: (NSDictionary *) response;

@end
