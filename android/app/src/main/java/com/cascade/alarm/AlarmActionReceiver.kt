package com.cascade.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Every way an alarm ends, in one place.
 *
 * FOUR VERBS AND ONLY THREE REACH THE APP.
 *   DONE            — the task is finished. The alarm is gone.
 *   SNOOZE:<min>    — a person pressed a number. The chain resets to zero autos.
 *   PUSH:<iso>      — a person moved the due date. The alarm is gone; the app
 *                     re-arms it against the new date on the next sync.
 *   AUTO            — nobody pressed anything and the ringing timed out. Internal.
 *   UNANSWERED      — the last auto rang out. The task escalates.
 *
 * `AUTO` never reaches the web app. Emitting one per auto would mean five store
 * writes and five sync round trips for one unanswered alarm, and the web app does
 * not need them: its diff compares `armedFor`, which an auto-snooze does not
 * move, so an app opened mid-chain leaves the chain alone without being told
 * anything. Only the end of the chain is a fact about the task.
 *
 * DONE AND PUSH BRING THE APP FORWARD. SNOOZE DOES NOT.
 *
 * Every press is queued either way, so nothing is lost whatever the person does
 * next. What differs is whether the phone asks to be unlocked.
 *
 * A snooze is an answer about the alarm and nothing else: the task has not
 * changed, there is nothing to look at, and being asked to unlock at six in the
 * morning to acknowledge a snooze is the app taking more than it gave. Done and
 * a push change the record, and a change you cannot see is a change you cannot
 * trust, so those two open the app and the queue drains while you watch.
 *
 * The unlock is not what applies the press. The queue is. If the phone is never
 * unlocked the press still lands the next time the app is opened, hours later or
 * the following day; opening it is what makes the landing visible rather than
 * what makes it happen. Nothing could make it happen at unlock without a second
 * copy of the whole write path living in Kotlin.
 *
 * PUSH CARRIES ITS WHOLE TARGET. The app computed the targets when it armed the
 * alarm, because choosing one reads the day's load off every stored task and
 * this process has none of them. So the ISO instant travels in the verb, offset
 * included, and this file decides nothing about when the task should land.
 */
class AlarmActionReceiver : BroadcastReceiver() {

    companion object {
        fun handle(ctx: Context, id: String, verb: String) {
            ctx.stopService(Intent(ctx, AlarmService::class.java))
            val a = AlarmStore.get(ctx, id)
            val now = System.currentTimeMillis()

            when {
                verb == "DONE" -> {
                    AlarmStore.cancel(ctx, id)
                    report(ctx, id, "DONE")
                    surface(ctx)
                }

                verb.startsWith("PUSH:") -> {
                    // The alarm is finished with: the task's date has moved, so
                    // the derived instant behind this alarm no longer exists.
                    // The app re-arms against the new date on its next sync.
                    AlarmStore.cancel(ctx, id)
                    report(ctx, id, verb)
                    surface(ctx)
                }

                verb.startsWith("SNOOZE") -> {
                    // The number is in the verb because the button carried it.
                    // A missing one falls back to the auto interval rather than a
                    // constant written here: this file states no policy.
                    val mins = verb.substringAfter(':', "").toIntOrNull()
                        ?: a?.autoSnoozeMin ?: 5
                    if (a != null) {
                        // A press answers the alarm, so the auto budget starts again.
                        AlarmStore.set(ctx, a.copy(atMs = now + mins * 60_000L, autoCount = 0))
                    }
                    report(ctx, id, "SNOOZE:$mins")
                }

                verb == "AUTO" -> {
                    if (a == null) return
                    val spent = a.autoCount + 1
                    if (spent > a.autoMax) {
                        // The chain is out. It stops rather than ringing on: an
                        // alarm that rings all morning teaches a person to stop
                        // hearing alarms, and the list is what carries it now.
                        AlarmStore.cancel(ctx, id)
                        report(ctx, id, "UNANSWERED")
                    } else {
                        AlarmStore.set(
                            ctx,
                            a.copy(atMs = now + a.autoSnoozeMin * 60_000L, autoCount = spent)
                        )
                    }
                }
            }
        }

        /** To the WebView if it is alive, and to the queue either way. */
        private fun report(ctx: Context, id: String, verb: String) {
            CascadeAlarmPlugin.emit(id, verb)
            PendingOutcomes.add(ctx, id, verb)
        }

        /**
         * Open the app so the queue drains where it can be seen. Called for Done
         * and for a push, never for a snooze.
         *
         * BEST EFFORT, AND DELIBERATELY LAST. Everything that matters — the
         * ringing stopping, the alarm being cancelled, the press being queued —
         * has already happened by the time this runs, so it is free to fail.
         * Android restricts starting an activity from the background, and on a
         * locked phone this is what raises the keyguard rather than what applies
         * the press: the queue applies the press, whenever the app is next
         * opened. Nothing is lost if this does nothing at all.
         *
         * It also does nothing when the WebView is already alive: it heard the
         * live event and has applied the press already, and pulling a running
         * app to the front would take the screen off whatever was on it.
         */
        fun surface(ctx: Context) {
            if (CascadeAlarmPlugin.isLive()) return
            val open = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName) ?: return
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            runCatching { ctx.startActivity(open) }
        }
    }

    override fun onReceive(ctx: Context, intent: Intent) {
        val id = intent.getStringExtra("id") ?: return
        // The action carries the verb, and a snooze carries its minutes with it:
        // `com.cascade.alarm.SNOOZE:30`.
        handle(ctx, id, intent.action?.substringAfterLast('.') ?: return)
    }
}

/**
 * Outcomes that happened while the WebView was dead, drained on next open.
 *
 * This is the normal case rather than the exception. An alarm rings at 6:45 on a
 * locked phone, a thumb hits Snooze 10 without unlocking, and the app is not
 * opened until nine. Nothing about that path involves the web app being alive.
 *
 * The key is `id:timestamp`, so two presses on one task both survive and drain in
 * the order they happened. A live listener may also have delivered the same
 * outcome; applying a snooze or a completion twice lands on the same record, so
 * the duplicate costs a write and changes nothing.
 */
object PendingOutcomes {
    private const val PREFS = "cascade_alarm_outcomes"

    fun add(ctx: Context, id: String, verb: String) {
        val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        p.edit().putString("$id:${System.currentTimeMillis()}", verb).apply()
    }

    fun drain(ctx: Context): List<Triple<String, String, Long>> {
        val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val out = p.all.mapNotNull { (k, v) ->
            val id = k.substringBeforeLast(':')
            val ts = k.substringAfterLast(':').toLongOrNull() ?: return@mapNotNull null
            Triple(id, v as String, ts)
        }
        p.edit().clear().apply()
        return out.sortedBy { it.third }
    }
}
