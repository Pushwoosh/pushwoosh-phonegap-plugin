# Keep all implementations of CallEventListener so that custom classes
# referenced via manifest metadata string are not stripped by R8/ProGuard
-keep class * implements com.pushwoosh.calls.listener.CallEventListener { *; }
