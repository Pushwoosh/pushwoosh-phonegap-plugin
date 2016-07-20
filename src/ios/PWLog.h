//
//  PWLog.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2016
//

#import <Foundation/Foundation.h>

typedef NS_ENUM(unsigned int, LogLevel) {
	kLogNone = 0,
	kLogError,
	kLogWarning,
	kLogInfo,
	kLogDebug,
	kLogVerbose
};

#define PWLog(...) PWLogInternal(__FUNCTION__, kLogInfo, __VA_ARGS__)
#define PWLogError(...) PWLogInternal(__FUNCTION__, kLogError, __VA_ARGS__)
#define PWLogWarn(...) PWLogInternal(__FUNCTION__, kLogWarning, __VA_ARGS__)
#define PWLogInfo(...) PWLogInternal(__FUNCTION__, kLogInfo, __VA_ARGS__)
#define PWLogDebug(...) PWLogInternal(__FUNCTION__, kLogDebug, __VA_ARGS__)
#define PWLogVerbose(...) PWLogInternal(__FUNCTION__, kLogVerbose, __VA_ARGS__)

void PWLogInternal(const char *function, LogLevel logLevel, NSString *format, ...);
