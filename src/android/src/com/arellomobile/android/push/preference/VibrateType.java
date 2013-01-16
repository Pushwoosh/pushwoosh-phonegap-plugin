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
	DEFAULT_MODE(0), NO_VIBRATE(1), ALWAYS(2);
    
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
            return DEFAULT_MODE;
        case 1:
            return NO_VIBRATE;
        case 2:
            return ALWAYS;
        }
        return DEFAULT_MODE;
    }
}
