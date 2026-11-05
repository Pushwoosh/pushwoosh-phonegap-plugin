package com.pushwoosh.plugin.pushnotifications;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.annotation.NonNull;
import com.pushwoosh.internal.utils.PWLog;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/**
 * VoIP Event Buffering Storage
 *
 * Provides persistent storage for VoIP events when WebView/JavaScript is not ready.
 * Reads and writes the whole buffer: load() returns the live events, replaceEvents() writes
 * back what should stay.
 */
public class VoIPEventStorage {
    private static final String TAG = "VoIPEventStorage";
    private static final String PREFS_NAME = "pushwoosh_voip_events";
    private static final String KEY_BUFFERED_EVENTS = "buffered_events";
    private static final long TTL_MILLIS = 24 * 60 * 60 * 1000; // 24 hours
    private static final Object STORAGE_LOCK = new Object();

    /**
     * Represents a stored VoIP event with metadata
     */
    public static class StoredEvent {
        public String type;
        public JSONObject payload;
        public long timestamp;

        public StoredEvent(String type, JSONObject payload, long timestamp) {
            this.type = type;
            this.payload = payload;
            this.timestamp = timestamp;
        }

        public boolean isExpired() {
            return (System.currentTimeMillis() - timestamp) > TTL_MILLIS;
        }
    }

    private static StoredEvent parseStoredEvent(@NonNull JSONObject eventObj) throws Exception {
        String type = eventObj.getString("type");
        JSONObject payload = eventObj.getJSONObject("payload");
        long timestamp = eventObj.getLong("timestamp");
        return new StoredEvent(type, payload, timestamp);
    }

    /**
     * Load all non-expired events from storage.
     */
    public static List<StoredEvent> loadEvents(@NonNull Context context) {
        PWLog.noise(TAG, "loadEvents()");

        List<StoredEvent> result = new ArrayList<>();

        try {
            synchronized (STORAGE_LOCK) {
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String data = prefs.getString(KEY_BUFFERED_EVENTS, "[]");
                JSONArray events = new JSONArray(data);

                for (int i = 0; i < events.length(); i++) {
                    try {
                        StoredEvent event = parseStoredEvent(events.getJSONObject(i));

                        if (event.isExpired()) {
                            continue;
                        }

                        result.add(event);
                    } catch (Exception e) {
                        PWLog.error(TAG, "Failed to parse VoIP event at index " + i + ", skipping", e);
                    }
                }
            }

        } catch (Exception e) {
            PWLog.error(TAG, "Failed to load VoIP events", e);
        }

        return result;
    }

    /**
     * Replace the whole buffer with the given events; an empty list removes the buffer.
     */
    public static boolean replaceEvents(@NonNull Context context, @NonNull List<StoredEvent> events) {
        PWLog.noise(TAG, "replaceEvents()");

        try {
            synchronized (STORAGE_LOCK) {
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

                if (events.isEmpty()) {
                    return prefs.edit().remove(KEY_BUFFERED_EVENTS).commit();
                }

                JSONArray array = new JSONArray();
                for (StoredEvent storedEvent : events) {
                    JSONObject event = new JSONObject();
                    event.put("type", storedEvent.type);
                    event.put("payload", storedEvent.payload);
                    event.put("timestamp", storedEvent.timestamp);
                    array.put(event);
                }

                return prefs.edit()
                    .putString(KEY_BUFFERED_EVENTS, array.toString())
                    .commit();
            }

        } catch (Exception e) {
            PWLog.error(TAG, "Failed to replace VoIP events", e);
            return false;
        }
    }
}
