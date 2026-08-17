package com.cascade.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/** Fired by AlarmManager at ring time. Hands off to the foreground service. */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        val id = intent.getStringExtra("id") ?: return
        val svc = Intent(ctx, AlarmService::class.java).putExtra("id", id)
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(svc)
        else ctx.startService(svc)
    }
}

/**
 * Re-arms everything after a reboot, because AlarmManager forgets.
 *
 * The auto-snooze chain restarts from zero rather than resuming, by decision. A
 * phone rebooted mid-chain gets five fresh autos. The cost is in spec.md: a phone
 * that reboots during every chain never reaches the end of one, so
 * `alarm_unanswered_at` is never written and the task never escalates. That
 * failure is silent, which is the worst kind, and it is recorded rather than
 * guarded against.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON"
        ) AlarmStore.rescheduleAll(ctx)
    }
}
