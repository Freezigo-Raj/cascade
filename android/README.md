# The alarm shell

Six Kotlin files and the manifest additions. `shell/alarm.bridge.js` in the web
app is the only thing that talks to them.

## What each file is

| File | Job |
|---|---|
| `CascadeAlarmPlugin.kt` | the JS surface: `set` `cancel` `list` `permissions` `drainOutcomes`, and the `alarmOutcome` listener |
| `AlarmStore.kt` | the shell's copy of each alarm, and AlarmManager. `setAlarmClock`, so it wakes from Doze |
| `AlarmReceiver.kt` | fires at ring time and starts the service. `BootReceiver` re-arms after a reboot |
| `AlarmService.kt` | the noise, on the alarm audio stream so it rings through silent and DND. Hands to `AUTO` after `ringSec` |
| `AlarmActivity.kt` | the lock screen: Done and one button per snooze interval |
| `AlarmActionReceiver.kt` | every way an alarm ends, plus the outcome queue |
| `MainActivity.java` | registers the plugin, and hands the back gesture to the app |

## Two things to know before changing anything

**No timing number lives in Kotlin.** The ring length, the auto-snooze interval,
the auto limit and the four snooze buttons all arrive in the `set()` payload from
`alarm.bridge.js`, which reads them from `config.ts`. The fallbacks in this code
exist for a malformed payload and are not the policy. A number stated in two
languages goes stale in one of them.

**`armedFor` is not `at`.** `at` is when the alarm will ring. `armedFor` is the
derived instant the web app armed it against, which is `due_at` less the lead. A
snooze moves `at` and leaves `armedFor` alone, and that difference is the whole
reason opening the app during a snooze no longer cancels it. `list()` returns
both and the web app's diff compares `armedFor`.

## Install

1. `npx cap add android` in the web app's folder.
2. Copy `app/src/main/java/com/cascade/alarm/` into the generated project.
2b. Copy `MainActivity.java` over the generated one, keeping its own `package`
   line. WITHOUT THIS THE APP HAS NO ALARM IN IT: a plugin written inside the app
   rather than installed from npm is not found on its own, and nothing about the
   build says so. It also hands the back gesture to the app.
3. Merge `AndroidManifest-additions.xml` into
   `android/app/src/main/AndroidManifest.xml`.
4. Add the Kotlin Gradle plugin to `android/app/build.gradle`:
   `apply plugin: 'kotlin-android'`, and the Kotlin classpath to the root
   `build.gradle`.
5. Point `capacitor.config.json` at the live app with `server.url`, so the web
   half updates without a new APK.

## The nine tests

The first eight passed on a Nothing Phone (2) against the standalone test app,
not against this build. The ninth has never been run anywhere.

1. Rings at the set time with the app in the foreground.
2. Rings over the lock screen.
3. Rings with the app killed.
4. A snooze press re-rings after the pressed interval.
5. Survives a reboot.
6. A press with the app closed reaches the task on next open.
7. Rings through silent and Do Not Disturb.
8. Stops ringing on its own after two minutes.
9. **Unattended, it snoozes itself five times and then writes
   `alarm_unanswered_at`, and the task rises to the top of the list with
   "Its alarm rang unanswered" on the row.**
