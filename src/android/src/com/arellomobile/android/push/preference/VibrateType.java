//
//  VibrateType.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed
package com.arellomobile.android.push.preference;

/**
 * User: MiG35
 * Date: 30.07.12
 * Time: 12:59
 */
public enum VibrateType
{
    NO_VIBRATE(0), DEFAULT_MODE(1), ALWAYS(2);
    
    private final int value;
    private VibrateType(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
    
    public static VibrateType fromInt(int x) {
        switch(x) {
        case 0:
            return NO_VIBRATE;
        case 1:
            return DEFAULT_MODE;
        case 2:
            return ALWAYS;
        }
        return NO_VIBRATE;
    }
}
