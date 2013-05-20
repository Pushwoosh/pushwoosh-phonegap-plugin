//
//  PWApplicationEventRequest
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRequest.h"

@interface PWApplicationEventRequest : PWRequest

@property (nonatomic, copy) NSString *goal;
@property (nonatomic, retain) NSNumber *count;

@end
