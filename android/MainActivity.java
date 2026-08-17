// Cascade — MainActivity for the Capacitor shell.
//
// COPY THIS OVER the MainActivity.java that `npx cap add android` generated, at
// cascade-shell/android/app/src/main/java/com/freezigo/cascade/MainActivity.java
// and keep the `package` line that is already in that file if it differs from
// the one below.
//
// It does two things the generated one does not.
//
// **It registers the plugin.** A Capacitor plugin written inside the app, rather
// than installed from npm, is not found on its own. Without this line the app
// builds, runs, looks correct and has no alarm in it, and the account screen
// reads "not present" with nothing to explain why. That cost a build.
//
// **It hands the back gesture to the app.** `popstate` is enough in a browser.
// In a WebView the gesture reaches this activity first, and Capacitor's default
// is to go back in WebView history if it thinks there is history to go back to.
// Entries added with `pushState` are same-page and whether they count varies, so
// the app is asked instead: `window.__cascadeBack()` returns true when it
// handled it and false when there is nowhere left to go, and only then does the
// activity close the app. The decision is one place, in the app, in the file
// that knows which screen is showing.

package com.freezigo.cascade;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.cascade.alarm.CascadeAlarmPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CascadeAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        // The answer arrives on a callback, so the default cannot simply run
        // afterwards: it runs inside the callback, or not at all. A WebView that
        // has not loaded yet, or an app that never set the hook, returns null
        // and falls through to the normal behaviour rather than trapping anyone.
        if (bridge == null || bridge.getWebView() == null) {
            super.onBackPressed();
            return;
        }
        bridge.getWebView().evaluateJavascript(
            "(window.__cascadeBack && window.__cascadeBack()) === true",
            value -> {
                if (!"true".equals(value)) {
                    // Nothing left inside the app. Leave, rather than sitting on
                    // a screen where the gesture appears to do nothing.
                    runOnUiThread(this::finish);
                }
            }
        );
    }
}
