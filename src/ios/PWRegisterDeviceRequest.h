//
//  PWRegisterDeviceRequest
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRequest.h"

@interface PWRegisterDeviceRequest : PWRequest

@property (nonatomic, copy) NSString *pushToken;
@property (nonatomic, copy) NSString *language;
@property (nonatomic, copy) NSString *timeZone;

@end
