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

---

## The calendar plugin (sessions 145 and 148)

A second app-local plugin, `com.cascade.calendar`. Two files:

```
android/app/src/main/java/com/cascade/calendar/CascadeCalendarPlugin.kt
android/app/src/main/java/com/cascade/calendar/CalendarStore.kt
```

**It must be registered in `MainActivity`, exactly like the alarm one.** Without
the line the APK builds, runs, looks correct, and the account screen reads
"not present" for the calendar with nothing to explain why. That cost a build
once already:

```java
import com.cascade.calendar.CascadeCalendarPlugin;
...
registerPlugin(CascadeCalendarPlugin.class);
```

**Two new permissions** in `AndroidManifest-additions.xml`: `READ_CALENDAR` and
`WRITE_CALENDAR`. Both are runtime permissions and both are asked for together
on the account screen, on a press. Reading is not optional — writing alone would
let the app insert rows and never see them again, so every sync would be an
insert and the calendar would fill with copies.

**No Google API is called.** The event goes into the phone's own calendar
provider, on a calendar owned by a Google account, and Google's sync adapter
carries it up. No Cloud project, no consent screen, no verification, no token
to refresh, and it works with no signal.

### Calendar build 4 (session 157) — the APK must be rebuilt

`readable()` returns `syncEvents`, which is `CalendarContract.Calendars.SYNC_EVENTS`.
It is the field that separates a calendar the phone keeps events for from one it
merely knows about: with it at 0 the provider holds no events and never will,
while the Google Calendar app still shows them from its own store. Without it, an
empty calendar and a withheld one are the same line. One column, no new
permissions.

### Calendar build 3 (session 153)

`events()` returns `rowId`, the provider's own row id, on every event. One line.
It is what lets a task imported from an event Google has never seen be relinked
to that event when the account finally syncs, instead of being deleted and
re-added with the alarm lost. No new permissions.

### Calendar build 2 (session 148)

`CascadeCalendarPlugin.kt` states `CALENDAR_BUILD = 4` and the account screen
prints what it found, so a web half expecting 2 against an APK carrying 1 is
visible rather than silent. Three new methods, all read-only:

| Method | What it does |
|---|---|
| `readable()` | every calendar the phone can read, with `writable`, `primary`, `visible` and `google`, plus its account name |
| `events({fromMs, toMs, calendarIds})` | queries `CalendarContract.Instances`, which **expands recurrence** so one row comes back per occurrence |
| `uidOf(eventId)` | `UID_2445`, then `_SYNC_ID`, then `row:<id>` — and it returns which one answered |

No new permissions: `READ_CALENDAR` was already asked for in session 145, for
the diff, and the import needs nothing the push did not already have.

**`row:<id>` is a local row number.** It is the last fallback and the account
screen prints when it was used, because an import on a second phone would
compute different task ids from it. A silent fallback there would look like
working sync right up to the day a second phone appears.

**Nothing here compiles Kotlin.** `gate2.py` runs `tsc --strict` over the web
half and these eight files are read by no tool. Every new method was checked by
hand for braces, parens and companion counts, which is a statement about care
and not a compiler. If the build fails, send the error.

