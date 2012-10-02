//
//  PWSetTagsRequest.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRequest.h"

@interface PWSetTagsRequest : PWRequest

@property (nonatomic, strong) NSDictionary *tags;

@end
