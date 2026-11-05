package com.pushwoosh.plugin.pushnotifications;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.pushwoosh.internal.utils.PWLog;

import org.apache.cordova.CallbackContext;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Routes VoIP events to the JavaScript subscriptions that are still alive.
 *
 * Every subscription is bound to the owner that created it, so the subscriptions of a destroyed
 * plugin instance can be dropped instead of silently swallowing events on a dead bridge. An event
 * that no live subscriber accepted is handed to the store and replayed later: into the next
 * subscriber of its type as soon as one appears, or into all of them on {@link #flush()}.
 *
 * The buffer is capped: a type nobody ever subscribes to would otherwise pile up one event per
 * missed call for a whole TTL window, and every write rewrites the stored buffer whole. Once the
 * cap is reached the oldest event of the most buffered type is dropped, so the types nobody takes
 * cannot crowd out the one event another type is still waiting to replay. Buffering goes through
 * load and replace, so the cap applies to what ends up on disk and expired events leave it on
 * every write.
 */
public final class VoipEventRegistry {
    public static final String TAG = "VoipEventRegistry";

    /**
     * Persistent buffer for events that could not be delivered.
     */
    public interface Store {
        /**
         * @return non-expired events in storage order.
         */
        @NonNull
        List<VoIPEventStorage.StoredEvent> load();

        void replace(@NonNull List<VoIPEventStorage.StoredEvent> remaining);
    }

    /**
     * Hands a payload to the Cordova bridge of the subscription owner.
     */
    public interface Deliverer {
        /**
         * @param target the callback context of the subscription.
         * @param owner  the object that created the subscription, used to tell whether its bridge
         *               is still usable.
         * @return true when the payload was handed to the bridge.
         */
        boolean deliver(@NonNull CallbackContext target, @NonNull Object owner, @NonNull JSONObject payload);
    }

    /**
     * Names the reason the JavaScript side cannot receive events right now.
     *
     * It is only consulted to label an event that nobody took, never to gate delivery: the
     * readiness of the bridge is process-wide, while a subscription belongs to a single page.
     */
    public interface Readiness {
        /**
         * @return why events cannot be delivered, or null when the bridge is ready.
         */
        @Nullable
        String notReadyReason();
    }

    private static final class Entry {
        final CallbackContext target;
        final Object owner;

        Entry(@NonNull CallbackContext target, @NonNull Object owner) {
            this.target = target;
            this.owner = owner;
        }
    }

    /**
     * Upper bound on the buffered events, counted across all types.
     */
    private static final int MAX_BUFFERED_EVENTS = 50;

    private final Map<String, List<Entry>> entriesByType = new HashMap<>();
    private final Object lock = new Object();

    private final Store store;
    private final Deliverer deliverer;
    private final Readiness readiness;

    public VoipEventRegistry(@NonNull Store store, @NonNull Deliverer deliverer, @NonNull Readiness readiness) {
        this.store = store;
        this.deliverer = deliverer;
        this.readiness = readiness;

        entriesByType.put("answer", new ArrayList<>());
        entriesByType.put("reject", new ArrayList<>());
        entriesByType.put("hangup", new ArrayList<>());
        entriesByType.put("voipPushPayload", new ArrayList<>());
        entriesByType.put("voipDidCancelCall", new ArrayList<>());
        entriesByType.put("voipDidFailToCancelCall", new ArrayList<>());
    }

    /**
     * Registers a subscription and immediately replays the buffered events of this type into it.
     */
    public void subscribe(@NonNull String type, @NonNull CallbackContext target, @NonNull Object owner) {
        synchronized (lock) {
            List<Entry> entries = entriesByType.get(type);
            if (entries == null) {
                PWLog.warn(TAG, "Unknown VoIP event type '" + type + "'");
                return;
            }

            entries.add(new Entry(target, owner));

            List<VoIPEventStorage.StoredEvent> stored = store.load();
            if (stored.isEmpty()) {
                return;
            }

            List<VoIPEventStorage.StoredEvent> remaining = new ArrayList<>();
            for (VoIPEventStorage.StoredEvent event : stored) {
                if (!type.equals(event.type) || !deliverer.deliver(target, owner, event.payload)) {
                    remaining.add(event);
                }
            }
            if (remaining.size() != stored.size()) {
                store.replace(remaining);
            }
        }
    }

    /**
     * Removes the owner's subscriptions for a single event type.
     *
     * @return false when the event type is unknown.
     */
    public boolean unsubscribe(@NonNull String type, @NonNull Object owner) {
        synchronized (lock) {
            List<Entry> entries = entriesByType.get(type);
            if (entries == null) {
                return false;
            }

            removeOwner(entries, owner);
            return true;
        }
    }

    /**
     * Removes every subscription of an owner whose bridge is gone.
     *
     * @return the number of removed subscriptions.
     */
    public int ownerDestroyed(@NonNull Object owner) {
        synchronized (lock) {
            int removed = 0;
            for (List<Entry> entries : entriesByType.values()) {
                removed += removeOwner(entries, owner);
            }

            if (removed > 0) {
                PWLog.info(TAG, "Removed " + removed + " VoIP subscriptions of a destroyed plugin instance");
            }
            return removed;
        }
    }

    /**
     * Delivers an event to the live subscriptions of its type, buffering it when nobody took it.
     *
     * Readiness is consulted only to name the buffering reason, so a page that is already
     * subscribed is served even while the process-wide readiness flags say otherwise.
     */
    public void emit(@NonNull String type, @NonNull JSONObject payload) {
        synchronized (lock) {
            List<Entry> entries = entriesByType.get(type);
            int delivered = entries == null ? 0 : deliverTo(new ArrayList<>(entries), payload);
            if (delivered == 0) {
                PWLog.info(TAG, "Buffering VoIP event '" + type + "': " + bufferingReason(entries));
                buffer(type, payload);
                return;
            }

            PWLog.info(TAG, "Delivered VoIP event '" + type + "' to " + delivered + " subscribers");
        }
    }

    /**
     * Replays every buffered event into the live subscriptions, keeping the ones nobody took.
     *
     * The store is always written back: the loaded list already excludes expired events, so the
     * write is what removes them from disk.
     */
    public void flush() {
        synchronized (lock) {
            List<VoIPEventStorage.StoredEvent> stored = store.load();
            if (!stored.isEmpty()) {
                PWLog.info(TAG, "Processing " + stored.size() + " persisted VoIP events");
            }

            List<VoIPEventStorage.StoredEvent> kept = new ArrayList<>();
            for (VoIPEventStorage.StoredEvent event : stored) {
                List<Entry> entries = entriesByType.get(event.type);
                int delivered = entries == null ? 0 : deliverTo(new ArrayList<>(entries), event.payload);
                if (delivered == 0) {
                    kept.add(event);
                }
            }
            store.replace(kept);
        }
    }

    @NonNull
    private String bufferingReason(@Nullable List<Entry> entries) {
        String reason = readiness.notReadyReason();
        if (reason != null) {
            return reason;
        }
        if (entries == null || entries.isEmpty()) {
            return "no callback contexts registered";
        }
        return "all " + entries.size() + " subscribers rejected the event";
    }

    private void buffer(@NonNull String type, @NonNull JSONObject payload) {
        List<VoIPEventStorage.StoredEvent> buffered = new ArrayList<>(store.load());
        buffered.add(new VoIPEventStorage.StoredEvent(type, payload, System.currentTimeMillis()));

        while (buffered.size() > MAX_BUFFERED_EVENTS) {
            String dropped = dropOldestOfMostBufferedType(buffered);
            PWLog.warn(TAG, "VoIP event buffer is full, dropping the oldest '" + dropped + "' event");
        }
        store.replace(buffered);
    }

    @NonNull
    private String dropOldestOfMostBufferedType(@NonNull List<VoIPEventStorage.StoredEvent> buffered) {
        Map<String, Integer> sizeByType = new HashMap<>();
        for (VoIPEventStorage.StoredEvent event : buffered) {
            Integer size = sizeByType.get(event.type);
            sizeByType.put(event.type, size == null ? 1 : size + 1);
        }

        int largest = Collections.max(sizeByType.values());
        int victim = 0;
        while (sizeByType.get(buffered.get(victim).type) != largest) {
            victim++;
        }
        return buffered.remove(victim).type;
    }

    private int deliverTo(@NonNull List<Entry> entries, @NonNull JSONObject payload) {
        int delivered = 0;
        for (Entry entry : entries) {
            if (deliverer.deliver(entry.target, entry.owner, payload)) {
                delivered++;
            }
        }
        return delivered;
    }

    private int removeOwner(@NonNull List<Entry> entries, @NonNull Object owner) {
        int removed = 0;
        Iterator<Entry> iterator = entries.iterator();
        while (iterator.hasNext()) {
            if (iterator.next().owner == owner) {
                iterator.remove();
                removed++;
            }
        }
        return removed;
    }
}
