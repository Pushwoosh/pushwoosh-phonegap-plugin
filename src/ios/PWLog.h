//
//  PWLog.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2025
//
//  Using PushwooshCore logging

#import <Foundation/Foundation.h>

// Logging macros using NSLog
#define PWLog(fmt, ...) NSLog(@"[Pushwoosh] %s: " fmt, __FUNCTION__, ##__VA_ARGS__)
#define PWLogError(fmt, ...) NSLog(@"[Pushwoosh ERROR] %s: " fmt, __FUNCTION__, ##__VA_ARGS__)
#define PWLogWarn(fmt, ...) NSLog(@"[Pushwoosh WARN] %s: " fmt, __FUNCTION__, ##__VA_ARGS__)
#define PWLogInfo(fmt, ...) NSLog(@"[Pushwoosh INFO] %s: " fmt, __FUNCTION__, ##__VA_ARGS__)
#define PWLogDebug(fmt, ...) NSLog(@"[Pushwoosh DEBUG] %s: " fmt, __FUNCTION__, ##__VA_ARGS__)
#define PWLogVerbose(fmt, ...) NSLog(@"[Pushwoosh VERBOSE] %s: " fmt, __FUNCTION__, ##__VA_ARGS__)

// Backward compatibility
#define PWLogInternal(func, level, fmt, ...) NSLog(@"[Pushwoosh] %s: " fmt, func, ##__VA_ARGS__)
