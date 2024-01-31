package com.pushwoosh.plugin.internal;

import org.json.JSONObject;
import java.nio.file.Files;
import java.nio.file.Paths;

public class ConfigReader {

    public static boolean getForegroundPushValue() {
        try {
            String content = new String(Files.readAllBytes(Paths.get("./capacitor.config.json")));
            JSONObject config = new JSONObject(content);
            return config.getBoolean("ANDROID_FOREGROUND_PUSH");
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
