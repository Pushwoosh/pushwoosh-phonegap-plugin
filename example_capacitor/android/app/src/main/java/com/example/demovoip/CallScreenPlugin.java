package com.example.demovoip;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CallScreen")
public class CallScreenPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        getActivity().startActivity(new Intent(getActivity(), CallScreenActivity.class));
        call.resolve();
    }
}
