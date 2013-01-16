//
//  SoundType.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed
package com.arellomobile.android.push.preference;

/**
 * User: MiG35
 * Date: 30.07.12
 * Time: 12:33
 */
public enum SoundType
{
	DEFAULT_MODE(0), NO_SOUND(1), ALWAYS(2);
    
    private final int value;
    private SoundType(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
    
    public static SoundType fromInt(int x) {
        switch(x) {
        case 0:
            return DEFAULT_MODE;
        case 1:
            return NO_SOUND;
        case 2:
            return ALWAYS;
        }
        return DEFAULT_MODE;
    }
}
