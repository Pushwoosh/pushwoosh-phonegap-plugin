package com.example.demovoip;

import android.app.Application;
import android.content.Context;

public class DemoApplication extends Application {

    private static Context appContext;

    public static Context context() {
        return appContext;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        appContext = getApplicationContext();
    }
}
