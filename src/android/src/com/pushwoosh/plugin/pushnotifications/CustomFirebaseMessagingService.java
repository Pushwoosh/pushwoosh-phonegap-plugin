package com.pushwoosh.plugin.pushnotifications;

import androidx.annotation.NonNull;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.pushwoosh.firebase.PushwooshFcmHelper;

public class CustomFirebaseMessagingService extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        if (PushwooshFcmHelper.isPushwooshMessage(remoteMessage)){
            PushwooshFcmHelper.onMessageReceived(this, remoteMessage);
        } else {
            //handle push from a different service here
        }
    }

    @Override
    public void onNewToken(@NonNull String s) {
        super.onNewToken(s);
        PushwooshFcmHelper.onTokenRefresh(s);
        sendTokenToAnotherService();
    }

    public void sendTokenToAnotherService() {
        //handle push registration of another service here
    }
}