//
//  PWLog.h
//  Pushwoosh SDK
//  (c) Pushwoosh 2025
//
//  Using PushwooshCore logging

#import <Foundation/Foundation.h>
#import <os/log.h>

// On modern iOS (including iOS 26) os_log/NSLog redact %@ and %s arguments as <private>
// by default. We format the message ourselves and emit it as a single {public} argument
// so the plugin's logs stay readable, mirroring PushwooshCore's PushwooshLog.
__attribute__((format(__NSString__, 3, 4), unused))
static void pw_log(NSString *tag, const char *func, NSString *format, ...) {
    va_list ap;
    va_start(ap, format);
    NSString *body = [[NSString alloc] initWithFormat:format arguments:ap];
    va_end(ap);
    os_log(OS_LOG_DEFAULT, "%{public}@", [NSString stringWithFormat:@"%@%s: %@", tag, func, body]);
}

// Logging macros — signatures unchanged; output now goes through os_log as {public}.
#define PWLog(fmt, ...)        pw_log(@"[Pushwoosh] ",         __FUNCTION__, fmt, ##__VA_ARGS__)
#define PWLogError(fmt, ...)   pw_log(@"[Pushwoosh ERROR] ",   __FUNCTION__, fmt, ##__VA_ARGS__)
#define PWLogWarn(fmt, ...)    pw_log(@"[Pushwoosh WARN] ",    __FUNCTION__, fmt, ##__VA_ARGS__)
#define PWLogInfo(fmt, ...)    pw_log(@"[Pushwoosh INFO] ",    __FUNCTION__, fmt, ##__VA_ARGS__)
#define PWLogDebug(fmt, ...)   pw_log(@"[Pushwoosh DEBUG] ",   __FUNCTION__, fmt, ##__VA_ARGS__)
#define PWLogVerbose(fmt, ...) pw_log(@"[Pushwoosh VERBOSE] ", __FUNCTION__, fmt, ##__VA_ARGS__)

// Backward compatibility
#define PWLogInternal(func, level, fmt, ...) pw_log(@"[Pushwoosh] ", func, fmt, ##__VA_ARGS__)
