package com.pushwoosh.plugin.pushnotifications;

import android.content.Context;

public final class CallsAdapterFactory {
    private static final String REAL_IMPL = "com.pushwoosh.plugin.pushnotifications.calls.PushwooshCallsAdapter";

    public static CallsAdapter create(Context ctx) {
        try {
            Class<?> c = Class.forName(REAL_IMPL);
            return (CallsAdapter) c.getDeclaredConstructor().newInstance();
        } catch (Throwable ignored) {
            return new NoopCallsAdapter();
        }
    }
}
