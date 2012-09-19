//
//  PWRequestManager.m
//  Pushwoosh SDK
//  (c) Pushwoosh 2012
//

#import "PWRequestManager.h"

@implementation PWRequestManager


+ (PWRequestManager *) sharedManager {
	static PWRequestManager *instance = nil;
	if (!instance) {
		instance = [[PWRequestManager alloc] init];
	}
	return instance;
}

- (BOOL) sendRequest: (PWRequest *) request {
	NSMutableArray *requestStringBuilder = [NSMutableArray new];
	NSDictionary *requestDict = [request requestDictionary];
	
	for (NSString *key in [requestDict allKeys]) {
		[requestStringBuilder addObject:[NSString stringWithFormat:@"\"%@\":%@", key, [requestDict objectForKey:key]]];
	}
	NSString *requestString = [requestStringBuilder componentsJoinedByString:@", "];
	NSString *jsonRequestData = [NSString stringWithFormat:@"{\"request\":{%@}}", requestString];
	[requestStringBuilder release];
	
	NSString *requestUrl = [kServiceAddress stringByAppendingString:[request methodName]];
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
	[urlRequest release]; urlRequest = nil;
	
	NSString *responseString = [[NSString alloc] initWithData:responseData encoding:NSUTF8StringEncoding];
	NSLog(@"Response \"%d %@\": string: %@", [response statusCode], [NSHTTPURLResponse localizedStringForStatusCode:[response statusCode]], responseString);
	
	[responseString release]; responseString = nil;
	if (response.statusCode != 200) 
		return NO;
	
	return YES;
}

@end
