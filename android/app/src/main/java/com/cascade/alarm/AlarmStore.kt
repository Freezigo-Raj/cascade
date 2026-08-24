package com.cascade.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject

/**
 * The shell's copy of an alarm. One entry per task id, surviving process death
 * and reboot, and talking to AlarmManager.
 *
 * TWO HOMES, AND THIS IS THE VOLATILE ONE. The task in Supabase carries
 * `alarm_snoozed_until`, which is the truth and what reaches the other devices.
 * This copy exists because the WebView is usually dead when an alarm rings, and
 * something has to be able to re-ring without it.
 *
 * `armedFor` IS THE FIELD THAT MATTERS. It is the derived instant the web app
 * armed this alarm against: due time less the lead. `atMs` is when it will
 * actually go off, which is not the same number once a snooze has moved it. The
 * web app's diff compares `armedFor` and never `atMs`, so a snoozed alarm and a
 * stale one stop looking alike. Comparing `atMs` is what used to make opening
 * the app during a snooze cancel the snooze.
 *
 * NOT ONE NUMBER IN THIS FILE IS A POLICY. The ring length, the auto-snooze
 * interval, the auto limit and the snooze buttons all arrive in the payload from
 * `alarm.bridge.js`, which reads them from config. A number that lives in two
 * languages goes stale in one of them, and this project has paid for that five
 * times already.
 */
object AlarmStore {
    private const val PREFS = "cascade_alarms"

    data class Alarm(
        val id: String,
        val atMs: Long,
        val armedForMs: Long,
        val title: String,
        val reason: String,
        val snoozeOptions: List<Int>,
        /** Where a push can land: label and the whole local-with-offset ISO. */
        val pushTargets: List<Pair<String, String>>,
        val ringSec: Int,
        val autoSnoozeMin: Int,
        val autoMax: Int,
        /**
         * Whether the task repeats (session 128). The lock screen words two of
         * its buttons on it — cancelling one run of a daily task is not
         * cancelling the task — and this shell cannot see the record, so the
         * payload says.
         */
        val repeats: Boolean,
        /** Autos spent in the chain now running. Never persisted past a reboot. */
        val autoCount: Int,
    )

    private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun read(id: String, raw: String): Alarm? = runCatching {
        val o = JSONObject(raw)
        val opts = mutableListOf<Int>()
        val arr = o.optJSONArray("snoozeOptions") ?: JSONArray()
        for (i in 0 until arr.length()) opts.add(arr.getInt(i))
        val pushes = mutableListOf<Pair<String, String>>()
        val parr = o.optJSONArray("pushTargets") ?: JSONArray()
        for (i in 0 until parr.length()) {
            val t = parr.getJSONObject(i)
            pushes.add(t.getString("label") to t.getString("iso"))
        }
        Alarm(
            id = id,
            atMs = o.getLong("at"),
            armedForMs = o.optLong("armedFor", o.getLong("at")),
            title = o.optString("title", "Reminder"),
            reason = o.optString("reason", ""),
            // A payload that somehow arrived without buttons still gets buttons.
            // An alarm with nothing to press is a phone that has to be rebooted.
            snoozeOptions = if (opts.isEmpty()) listOf(5, 10, 30, 60) else opts,
            // No fallback. A push target the app did not send is a date this
            // code would have to invent, and inventing a due date is the one
            // thing the whole project refuses. No targets means no buttons.
            pushTargets = pushes,
            ringSec = o.optInt("ringSec", 120),
            autoSnoozeMin = o.optInt("autoSnoozeMin", 5),
            autoMax = o.optInt("autoMax", 5),
            // False when absent, which is what an alarm armed by an older web
            // half looks like: it wears the plain wording rather than claiming
            // a repeat this shell cannot confirm.
            repeats = o.optBoolean("repeats", false),
            autoCount = o.optInt("autoCount", 0),
        )
    }.getOrNull()

    fun all(ctx: Context): List<Alarm> =
        prefs(ctx).all.mapNotNull { (k, v) -> read(k, v as? String ?: return@mapNotNull null) }

    fun get(ctx: Context, id: String): Alarm? =
        prefs(ctx).getString(id, null)?.let { read(id, it) }

    fun set(ctx: Context, alarm: Alarm) {
        val opts = JSONArray()
        alarm.snoozeOptions.forEach { opts.put(it) }
        val pushes = JSONArray()
        alarm.pushTargets.forEach {
            pushes.put(JSONObject().put("label", it.first).put("iso", it.second))
        }
        prefs(ctx).edit().putString(
            alarm.id,
            JSONObject()
                .put("at", alarm.atMs)
                .put("armedFor", alarm.armedForMs)
                .put("title", alarm.title)
                .put("reason", alarm.reason)
                .put("snoozeOptions", opts)
                .put("pushTargets", pushes)
                .put("ringSec", alarm.ringSec)
                .put("autoSnoozeMin", alarm.autoSnoozeMin)
                .put("autoMax", alarm.autoMax)
                .put("repeats", alarm.repeats)
                .put("autoCount", alarm.autoCount)
                .toString()
        ).apply()
        schedule(ctx, alarm)
    }

    fun cancel(ctx: Context, id: String) {
        prefs(ctx).edit().remove(id).apply()
        alarmManager(ctx).cancel(pending(ctx, id))
    }

    /**
     * After a reboot. AlarmManager forgets everything, so each stored alarm is
     * armed again at the instant it was holding.
     *
     * THE CHAIN RESTARTS. `autoCount` goes back to zero, by decision: a reboot
     * mid-chain means five fresh autos rather than the two that were left. The
     * cost is stated in spec.md — a phone that reboots during every chain never
     * reaches the end of one, so the task never escalates, and that failure is
     * silent.
     */
    fun rescheduleAll(ctx: Context) = all(ctx).forEach { set(ctx, it.copy(autoCount = 0)) }

    fun canScheduleExact(ctx: Context): Boolean =
        Build.VERSION.SDK_INT < 31 || alarmManager(ctx).canScheduleExactAlarms()

    private fun schedule(ctx: Context, alarm: Alarm) {
        val am = alarmManager(ctx)
        val pi = pending(ctx, alarm.id)
        val at = maxOf(alarm.atMs, System.currentTimeMillis() + 1000)
        if (canScheduleExact(ctx)) {
            // setAlarmClock is the highest priority class there is: exact, wakes
            // from Doze, and shows the alarm icon in the status bar, which is the
            // only warning a person gets that something is set.
            am.setAlarmClock(AlarmManager.AlarmClockInfo(at, pi), pi)
        } else {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
        }
    }

    private fun pending(ctx: Context, id: String): PendingIntent {
        val i = Intent(ctx, AlarmReceiver::class.java).putExtra("id", id)
        return PendingIntent.getBroadcast(
            ctx, id.hashCode(), i,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun alarmManager(ctx: Context) =
        ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
}
