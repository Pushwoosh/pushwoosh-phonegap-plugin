package com.pushwoosh.plugin.pushnotifications;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import androidx.annotation.NonNull;

import org.apache.cordova.CallbackContext;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class VoipEventRegistryTest {
    private static final String ANSWER = "answer";
    private static final String HANGUP = "hangup";
    private static final String UNKNOWN = "held";
    private static final int BUFFER_CAP = 50;

    private static final class InMemoryStore implements VoipEventRegistry.Store {
        private List<VoIPEventStorage.StoredEvent> events = new ArrayList<>();

        void append(@NonNull String type, @NonNull JSONObject payload) {
            events.add(new VoIPEventStorage.StoredEvent(type, payload, System.currentTimeMillis()));
        }

        void appendExpired(@NonNull String type) {
            long dayAndHourAgo = System.currentTimeMillis() - 25L * 60 * 60 * 1000;
            events.add(new VoIPEventStorage.StoredEvent(type, new JSONObject(), dayAndHourAgo));
        }

        @NonNull
        @Override
        public List<VoIPEventStorage.StoredEvent> load() {
            List<VoIPEventStorage.StoredEvent> alive = new ArrayList<>();
            for (VoIPEventStorage.StoredEvent event : events) {
                if (!event.isExpired()) {
                    alive.add(event);
                }
            }
            return alive;
        }

        @Override
        public void replace(@NonNull List<VoIPEventStorage.StoredEvent> remaining) {
            events = new ArrayList<>(remaining);
        }

        List<String> types() {
            List<String> types = new ArrayList<>();
            for (VoIPEventStorage.StoredEvent event : events) {
                types.add(event.type);
            }
            return types;
        }
    }

    private static final class RecordingDeliverer implements VoipEventRegistry.Deliverer {
        final List<CallbackContext> targets = new ArrayList<>();
        final List<Object> owners = new ArrayList<>();
        final List<JSONObject> payloads = new ArrayList<>();
        final Set<CallbackContext> rejecting = new HashSet<>();
        final Set<Object> rejectingOwners = new HashSet<>();
        boolean accept = true;

        @Override
        public boolean deliver(@NonNull CallbackContext target, @NonNull Object owner, @NonNull JSONObject payload) {
            targets.add(target);
            owners.add(owner);
            payloads.add(payload);
            return accept && !rejecting.contains(target) && !rejectingOwners.contains(owner);
        }
    }

    private final InMemoryStore store = new InMemoryStore();
    private final RecordingDeliverer deliverer = new RecordingDeliverer();
    private final String[] reason = {null};

    private VoipEventRegistry registry;
    private CallbackContext targetA;
    private CallbackContext targetB;
    private Object owner1;
    private Object owner2;

    @Before
    public void setUp() {
        registry = new VoipEventRegistry(store, deliverer, () -> reason[0]);
        targetA = new CallbackContext("cb1", null);
        targetB = new CallbackContext("cb2", null);
        owner1 = new Object();
        owner2 = new Object();
    }

    @Test
    public void emitBuffersWhenNotReadyAndNobodySubscribed() {
        reason[0] = "JS not ready";

        registry.emit(ANSWER, new JSONObject());

        assertEquals(Collections.emptyList(), deliverer.targets);
        assertEquals(Collections.singletonList(ANSWER), store.types());
    }

    @Test
    public void emitDeliversToLiveSubscriberEvenWhenNotReady() {
        reason[0] = "JS not ready";
        registry.subscribe(ANSWER, targetA, owner1);

        registry.emit(ANSWER, new JSONObject());

        assertEquals(Collections.singletonList(targetA), deliverer.targets);
        assertEquals(Collections.emptyList(), store.types());
    }

    @Test
    public void emitBuffersWithoutSubscribers() {
        registry.emit(ANSWER, new JSONObject());

        assertEquals(Collections.emptyList(), deliverer.targets);
        assertEquals(Collections.singletonList(ANSWER), store.types());
    }

    @Test
    public void emitDeliversToEveryLiveSubscriberOfType() {
        registry.subscribe(ANSWER, targetA, owner1);
        registry.subscribe(ANSWER, targetB, owner2);
        JSONObject payload = new JSONObject();

        registry.emit(ANSWER, payload);

        assertEquals(Arrays.asList(targetA, targetB), deliverer.targets);
        assertEquals(Arrays.asList(payload, payload), deliverer.payloads);
        assertEquals(Collections.emptyList(), store.types());
    }

    @Test
    public void emitToOtherTypeBuffers() {
        registry.subscribe(ANSWER, targetA, owner1);

        registry.emit(HANGUP, new JSONObject());

        assertEquals(Collections.emptyList(), deliverer.targets);
        assertEquals(Collections.singletonList(HANGUP), store.types());
    }

    @Test
    public void emitUnknownTypeBuffers() {
        registry.emit(UNKNOWN, new JSONObject());

        assertEquals(Collections.emptyList(), deliverer.targets);
        assertEquals(Collections.singletonList(UNKNOWN), store.types());
    }

    @Test
    public void emitBuffersWhenEveryDeliveryIsRejected() {
        deliverer.accept = false;
        registry.subscribe(ANSWER, targetA, owner1);

        registry.emit(ANSWER, new JSONObject());

        assertEquals(Collections.singletonList(targetA), deliverer.targets);
        assertEquals(Collections.singletonList(ANSWER), store.types());
    }

    @Test
    public void emitDropsEventWhenOneOfTwoSubscribersAccepts() {
        deliverer.rejecting.add(targetB);
        registry.subscribe(ANSWER, targetA, owner1);
        registry.subscribe(ANSWER, targetB, owner2);

        registry.emit(ANSWER, new JSONObject());

        assertEquals(Arrays.asList(targetA, targetB), deliverer.targets);
        assertEquals(Collections.emptyList(), store.types());
    }

    @Test
    public void emitBuffersWhenDelivererRejectsTheOwnerOfTheOnlySubscriber() {
        deliverer.rejectingOwners.add(owner1);
        registry.subscribe(ANSWER, targetA, owner1);

        registry.emit(ANSWER, new JSONObject());

        assertEquals(Collections.singletonList(targetA), deliverer.targets);
        assertEquals(Collections.singletonList(owner1), deliverer.owners);
        assertEquals(Collections.singletonList(ANSWER), store.types());
    }

    @Test
    public void twoRegistrationsOfOneOwnerBothReceiveTheEvent() {
        registry.subscribe(ANSWER, targetA, owner1);
        registry.subscribe(ANSWER, targetB, owner1);

        registry.emit(ANSWER, new JSONObject());

        assertEquals(Arrays.asList(targetA, targetB), deliverer.targets);
    }

    @Test
    public void subscribeReplaysStoredEventsOfItsTypeInOrder() {
        JSONObject hangupPayload = new JSONObject();
        JSONObject first = new JSONObject();
        JSONObject second = new JSONObject();
        store.append(HANGUP, hangupPayload);
        store.append(ANSWER, first);
        store.append(ANSWER, second);

        registry.subscribe(ANSWER, targetA, owner1);

        assertEquals(Arrays.asList(targetA, targetA), deliverer.targets);
        assertEquals(Arrays.asList(first, second), deliverer.payloads);
        assertEquals(Collections.singletonList(HANGUP), store.types());
    }

    @Test
    public void subscribeReplaysOnlyIntoTheNewSubscriber() {
        registry.subscribe(ANSWER, targetA, owner1);
        store.append(ANSWER, new JSONObject());

        registry.subscribe(ANSWER, targetB, owner2);

        assertEquals(Collections.singletonList(targetB), deliverer.targets);
        assertEquals(Collections.emptyList(), store.types());
    }

    @Test
    public void subscribeWithEmptyStoreOnlyAddsEntry() {
        registry.subscribe(ANSWER, targetA, owner1);
        assertEquals(Collections.emptyList(), deliverer.targets);

        registry.emit(ANSWER, new JSONObject());

        assertEquals(Collections.singletonList(targetA), deliverer.targets);
    }

    @Test
    public void subscribeUnknownTypeIsIgnored() {
        registry.subscribe(UNKNOWN, targetA, owner1);

        registry.emit(UNKNOWN, new JSONObject());

        assertEquals(Collections.emptyList(), deliverer.targets);
        assertEquals(Collections.singletonList(UNKNOWN), store.types());
    }

    @Test
    public void unsubscribeRemovesOnlyTheOwnersEntries() {
        registry.subscribe(ANSWER, targetA, owner1);
        registry.subscribe(ANSWER, targetB, owner2);

        assertTrue(registry.unsubscribe(ANSWER, owner1));
        registry.emit(ANSWER, new JSONObject());

        assertEquals(Collections.singletonList(targetB), deliverer.targets);
    }

    @Test
    public void unsubscribeUnknownTypeReturnsFalse() {
        assertFalse(registry.unsubscribe(UNKNOWN, owner1));
    }

    @Test
    public void unsubscribeKnownTypeWithoutEntriesReturnsTrue() {
        assertTrue(registry.unsubscribe(ANSWER, owner1));
    }

    @Test
    public void ownerDestroyedRemovesEntriesAcrossTypes() {
        registry.subscribe(ANSWER, targetA, owner1);
        registry.subscribe(HANGUP, targetA, owner1);
        registry.subscribe(ANSWER, targetB, owner2);

        assertEquals(2, registry.ownerDestroyed(owner1));

        registry.emit(ANSWER, new JSONObject());
        assertEquals(Collections.singletonList(targetB), deliverer.targets);

        registry.emit(HANGUP, new JSONObject());
        assertEquals(Collections.singletonList(targetB), deliverer.targets);
        assertEquals(Collections.singletonList(HANGUP), store.types());
    }

    @Test
    public void flushDeliversTypesWithSubscribersAndKeepsTheRest() {
        registry.subscribe(ANSWER, targetA, owner1);
        JSONObject answerPayload = new JSONObject();
        store.append(ANSWER, answerPayload);
        store.append(HANGUP, new JSONObject());

        registry.flush();

        assertEquals(Collections.singletonList(targetA), deliverer.targets);
        assertEquals(Collections.singletonList(answerPayload), deliverer.payloads);
        assertEquals(Collections.singletonList(HANGUP), store.types());
    }

    @Test
    public void flushDeliversToAllSubscribersOfType() {
        registry.subscribe(ANSWER, targetA, owner1);
        registry.subscribe(ANSWER, targetB, owner2);
        store.append(ANSWER, new JSONObject());

        registry.flush();

        assertEquals(Arrays.asList(targetA, targetB), deliverer.targets);
        assertEquals(Collections.emptyList(), store.types());
    }

    @Test
    public void flushKeepsEventsOfUnknownType() {
        store.append(UNKNOWN, new JSONObject());

        registry.flush();

        assertEquals(Collections.emptyList(), deliverer.targets);
        assertEquals(Collections.singletonList(UNKNOWN), store.types());
    }

    @Test
    public void flushOnEmptyStoreDeliversNothing() {
        registry.flush();

        assertEquals(Collections.emptyList(), deliverer.targets);
        assertEquals(Collections.emptyList(), store.types());
    }

    @Test
    public void flushDropsExpiredEventsNobodyTook() {
        store.appendExpired(ANSWER);

        registry.flush();

        assertEquals(Collections.emptyList(), deliverer.targets);
        assertEquals(Collections.emptyList(), store.types());
    }

    @Test
    public void emitBufferingDropsExpiredEventsFromTheStore() {
        store.appendExpired(HANGUP);

        registry.emit(ANSWER, new JSONObject());

        assertEquals(Collections.singletonList(ANSWER), store.types());
    }

    @Test
    public void emitStopsBufferFromGrowingPastTheCap() {
        List<JSONObject> emitted = new ArrayList<>();
        for (int i = 0; i < BUFFER_CAP + 5; i++) {
            JSONObject payload = new JSONObject();
            emitted.add(payload);
            registry.emit(ANSWER, payload);
        }

        assertEquals(BUFFER_CAP, store.types().size());

        registry.subscribe(ANSWER, targetA, owner1);

        assertEquals(emitted.subList(5, emitted.size()), deliverer.payloads);
        assertEquals(Collections.emptyList(), store.types());
    }

    @Test
    public void bufferCapCountsEventsOfAllTypesTogether() {
        for (int i = 0; i < BUFFER_CAP; i++) {
            registry.emit(HANGUP, new JSONObject());
        }
        JSONObject answer = new JSONObject();

        registry.emit(ANSWER, answer);

        assertEquals(BUFFER_CAP, store.types().size());
        assertEquals(ANSWER, store.types().get(BUFFER_CAP - 1));
    }

    @Test
    public void bufferCapDropsTheMostBufferedTypeInsteadOfTheOldestEvent() {
        JSONObject answer = new JSONObject();
        registry.emit(ANSWER, answer);
        for (int i = 0; i < BUFFER_CAP; i++) {
            registry.emit(HANGUP, new JSONObject());
        }

        assertEquals(BUFFER_CAP, store.types().size());
        assertEquals(ANSWER, store.types().get(0));

        registry.subscribe(ANSWER, targetA, owner1);

        assertEquals(Collections.singletonList(answer), deliverer.payloads);
    }

    @Test
    public void bufferCapKeepsDroppingTheCrowdedTypeWhileAnotherOneWaits() {
        JSONObject answer = new JSONObject();
        registry.emit(ANSWER, answer);
        for (int i = 0; i < BUFFER_CAP * 3; i++) {
            registry.emit(HANGUP, new JSONObject());
        }

        List<String> buffered = store.types();
        assertEquals(BUFFER_CAP, buffered.size());
        assertEquals(1, Collections.frequency(buffered, ANSWER));
        assertEquals(BUFFER_CAP - 1, Collections.frequency(buffered, HANGUP));
    }
}
