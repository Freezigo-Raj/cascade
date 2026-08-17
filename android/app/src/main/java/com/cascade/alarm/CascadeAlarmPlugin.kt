package com.cascade.alarm

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * The JS surface. `shell/alarm.bridge.js` is the only caller.
 *
 *   CascadeAlarm.set({ id, at, armedFor, title, reason, snoozeOptions,
 *                      pushTargets, ringSec, autoSnoozeMin, autoMax })
 *   CascadeAlarm.cancel({ id })
 *   CascadeAlarm.list()                    -> { alarms: [{ id, at, armedFor, title, reason }] }
 *   CascadeAlarm.permissions()             -> { exactAlarm, batteryExempt,
 *                                              fullScreen, notifications }
 *   CascadeAlarm.requestExactAlarm()       — opens the one-time settings screen
 *   CascadeAlarm.requestBatteryExemption() — opens the one-time settings screen
 *   CascadeAlarm.requestFullScreen()       — opens the one-time settings screen
 *   CascadeAlarm.requestNotifications()    — the runtime prompt, or the screen
 *
 * FOUR PERMISSIONS AND EACH IS READ, NOT ASSUMED. An app that cannot tell which
 * of them it is missing can only say "something is wrong", which is what the
 * account screen said for two builds while the answer was one switch.
 *   CascadeAlarm.drainOutcomes()           -> { outcomes: [{ id, verb, ts }] }
 *   addListener('alarmOutcome', ({ id, verb }) => …)
 *
 * `list()` RETURNS `armedFor`, and that is the field the web app diffs on. `at`
 * is what will ring, which is a different number once a snooze has moved it.
 * Diffing on `at` is what used to cancel a live snooze the moment the app opened.
 *
 * Every timing number arrives in `set()`. Nothing in Kotlin decides how long an
 * alarm rings or how many times it may snooze itself, because a number stated in
 * two languages goes stale in one of them.
 */
@CapacitorPlugin(name = "CascadeAlarm")
class CascadeAlarmPlugin : Plugin() {

    companion object {
        private var live: CascadeAlarmPlugin? = null
        /** Whether a WebView is alive to hear an outcome. */
        fun isLive(): Boolean = live != null

        fun emit(id: String, verb: String) {
            live?.notifyListeners("alarmOutcome", JSObject().put("id", id).put("verb", verb))
        }
    }

    override fun load() {
        live = this
        if (Build.VERSION.SDK_INT >= 33 &&
            context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) !=
                android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            activity.requestPermissions(
                arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 9001
            )
        }
    }

    override fun handleOnDestroy() { if (live === this) live = null }

    @PluginMethod
    fun set(call: PluginCall) {
        val id = call.getString("id") ?: return call.reject("id required")
        val at = call.getLong("at") ?: return call.reject("at (epoch ms) required")
        val opts = mutableListOf<Int>()
        call.getArray("snoozeOptions")?.let { arr ->
            for (i in 0 until arr.length()) runCatching { opts.add(arr.getInt(i)) }
        }
        val pushes = mutableListOf<Pair<String, String>>()
        call.getArray("pushTargets")?.let { arr ->
            for (i in 0 until arr.length()) runCatching {
                val t = arr.getJSONObject(i)
                pushes.add(t.getString("label") to t.getString("iso"))
            }
        }
        // An existing entry's `autoCount` is kept when the arming instant has not
        // changed, so a payload refresh mid-chain does not hand the task five more
        // autos. A new instant is a new chain and starts at zero.
        val armedFor = call.getLong("armedFor") ?: at
        val keep = AlarmStore.get(context, id)?.takeIf { it.armedForMs == armedFor }?.autoCount ?: 0
        AlarmStore.set(
            context,
            AlarmStore.Alarm(
                id = id,
                atMs = at,
                armedForMs = armedFor,
                title = call.getString("title") ?: "Reminder",
                reason = call.getString("reason") ?: "",
                snoozeOptions = if (opts.isEmpty()) listOf(5, 10, 30, 60) else opts,
                pushTargets = pushes,
                ringSec = call.getInt("ringSec") ?: 120,
                autoSnoozeMin = call.getInt("autoSnoozeMin") ?: 5,
                autoMax = call.getInt("autoMax") ?: 5,
                autoCount = keep,
            )
        )
        call.resolve()
    }

    @PluginMethod
    fun cancel(call: PluginCall) {
        val id = call.getString("id") ?: return call.reject("id required")
        AlarmStore.cancel(context, id)
        call.resolve()
    }

    @PluginMethod
    fun list(call: PluginCall) {
        val arr = JSArray()
        AlarmStore.all(context).forEach {
            arr.put(
                JSObject()
                    .put("id", it.id)
                    .put("at", it.atMs)
                    .put("armedFor", it.armedForMs)
                    .put("title", it.title)
                    .put("reason", it.reason)
            )
        }
        call.resolve(JSObject().put("alarms", arr))
    }

    @PluginMethod
    fun permissions(call: PluginCall) {
        val pm = context.getSystemService(PowerManager::class.java)
        call.resolve(
            JSObject()
                .put("exactAlarm", AlarmStore.canScheduleExact(context))
                .put("batteryExempt", pm.isIgnoringBatteryOptimizations(context.packageName))
                .put("fullScreen", canFullScreen())
                .put("notifications", canNotify())
        )
    }

    /**
     * Android 14 stopped granting `USE_FULL_SCREEN_INTENT` on declaration alone
     * to anything that is not a clock or a phone dialler, and an app installed
     * outside the Play Store is neither as far as the system is concerned. A
     * withheld one does not stop the alarm: it arrives as a heads-up notification
     * that rings, with Done and one snooze, and the lock screen with the full set
     * of buttons never appears. Nothing says so, which is why this is read.
     */
    private fun canFullScreen(): Boolean {
        if (Build.VERSION.SDK_INT < 34) return true
        val nm = context.getSystemService(android.app.NotificationManager::class.java)
        return runCatching { nm.canUseFullScreenIntent() }.getOrDefault(true)
    }

    private fun canNotify(): Boolean {
        if (Build.VERSION.SDK_INT < 33) return true
        return context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
    }

    /**
     * The settings screen for full-screen notifications. The action string is
     * written out rather than referenced, so this compiles against a platform
     * older than the one that added the constant.
     */
    @PluginMethod
    fun requestFullScreen(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= 34 && !canFullScreen()) {
            runCatching {
                activity.startActivity(
                    Intent("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT")
                        .setData(Uri.parse("package:${context.packageName}"))
                )
            }.onFailure {
                // Some builds do not carry that screen. The app's own notification
                // settings is the nearest place a person can act.
                activity.startActivity(
                    Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                        .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                )
            }
        }
        call.resolve()
    }

    /** The runtime prompt while it is still offered, the settings screen after. */
    @PluginMethod
    fun requestNotifications(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= 33 && !canNotify()) {
            activity.requestPermissions(
                arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 9001
            )
        } else if (!canNotify()) {
            activity.startActivity(
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
            )
        }
        call.resolve()
    }

    @PluginMethod
    fun requestExactAlarm(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= 31 && !AlarmStore.canScheduleExact(context)) {
            activity.startActivity(
                Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                    .setData(Uri.parse("package:${context.packageName}"))
            )
        }
        call.resolve()
    }

    @PluginMethod
    fun requestBatteryExemption(call: PluginCall) {
        val pm = context.getSystemService(PowerManager::class.java)
        if (!pm.isIgnoringBatteryOptimizations(context.packageName)) {
            activity.startActivity(
                Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                    .setData(Uri.parse("package:${context.packageName}"))
            )
        }
        call.resolve()
    }

    @PluginMethod
    fun drainOutcomes(call: PluginCall) {
        val arr = JSArray()
        PendingOutcomes.drain(context).forEach { (id, verb, ts) ->
            arr.put(JSObject().put("id", id).put("verb", verb).put("ts", ts))
        }
        call.resolve(JSObject().put("outcomes", arr))
    }
}
