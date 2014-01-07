//
//  PWRequestManager.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRequestManager.h"
#import "PW_SBJsonWriter.h"
#import "PW_SBJsonParser.h"

#if ! __has_feature(objc_arc)
#error "ARC is required to compile Pushwoosh SDK"
#endif

@implementation PWRequestManager

//we really do not transfer any sensitive data here, but you may uncomment this line out to enable plain version of the API
//#define NOSSL

+ (PWRequestManager *) sharedManager {
	static PWRequestManager *instance = nil;
	if (!instance) {
		instance = [[PWRequestManager alloc] init];
	}
	return instance;
}

- (BOOL) sendRequest: (PWRequest *) request {
	return [self sendRequest:request error:nil];
}

- (BOOL) sendRequest: (PWRequest *) request error:(NSError **)retError {
	NSDictionary *requestDict = [request requestDictionary];
	
	PW_SBJsonWriter * json = [[PW_SBJsonWriter alloc] init];
	NSString *requestString = [json stringWithObject:requestDict];
	json = nil;

	NSString *jsonRequestData = [NSString stringWithFormat:@"{\"request\":%@}", requestString];
	
#ifdef NOSSL
	NSString *requestUrl = [kServiceAddressNoSSL stringByAppendingString:[request methodName]];
#else
	NSString *requestUrl = [kServiceAddressSSL stringByAppendingString:[request methodName]];
#endif
	
	NSLog(@"Sending request: %@", jsonRequestData);
	NSLog(@"To urL %@", requestUrl);
	
	NSMutableURLRequest *urlRequest = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:requestUrl]];
	[urlRequest setHTTPMethod:@"POST"];
	[urlRequest addValue:@"application/json; charset=utf-8" forHTTPHeaderField:@"Content-Type"];
	[urlRequest setHTTPBody:[jsonRequestData dataUsingEncoding:NSUTF8StringEncoding]];
	
	//Send data to server
	NSHTTPURLResponse *response = nil;
	NSError *error = nil;
	NSData * responseData = [NSURLConnection sendSynchronousRequest:urlRequest returningResponse:&response error:&error];
	urlRequest = nil;
	
	if(retError)
		*retError = error;
	
	NSString *responseString = [[NSString alloc] initWithData:responseData encoding:NSUTF8StringEncoding];
	NSLog(@"Response \"%d %@\": string: %@", [response statusCode], [NSHTTPURLResponse localizedStringForStatusCode:[response statusCode]], responseString);

	PW_SBJsonParser * jsonReader = [[PW_SBJsonParser alloc] init];
	NSDictionary *jsonResult = [jsonReader objectWithString:responseString];
	jsonReader = nil;
	responseString = nil;
	
	NSInteger pushwooshResult = [[jsonResult objectForKey:@"status_code"] intValue];

	if (response.statusCode != 200 || pushwooshResult != 200)
	{
		if(retError && !error)
			*retError = [NSError errorWithDomain:@"com.pushwoosh" code:response.statusCode userInfo:jsonResult];

		return NO;
	}
	
	[request parseResponse:jsonResult];
	
	return YES;
}

@end
