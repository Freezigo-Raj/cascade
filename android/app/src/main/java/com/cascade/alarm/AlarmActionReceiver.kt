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
 *   AUTO            — nobody pressed anything and the ringing timed out. Internal.
 *   UNANSWERED      — the last auto rang out. The task escalates.
 *
 * `AUTO` never reaches the web app. Emitting one per auto would mean five store
 * writes and five sync round trips for one unanswered alarm, and the web app does
 * not need them: its diff compares `armedFor`, which an auto-snooze does not
 * move, so an app opened mid-chain leaves the chain alone without being told
 * anything. Only the end of the chain is a fact about the task.
 *
 * PUSH IS NOT HERE. Moving a due date reads the day's load off every other task,
 * which is the app's job and needs the app running, so it needs an unlock. What
 * is on the lock screen is Done and the snooze buttons.
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
