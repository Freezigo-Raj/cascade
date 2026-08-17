package com.cascade.alarm

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * The noise. A looping alarm sound and vibration on the alarm audio stream, so it
 * rings through media-mute and Do Not Disturb, with a full-screen intent so
 * `AlarmActivity` appears over the lock screen.
 *
 * IT NO LONGER JUST STOPS. Ringing runs for `ringSec` and then hands to `AUTO`,
 * which snoozes it and arms it again. Two minutes of noise is enough to wake
 * someone and short enough not to be the reason the phone gets silenced for ever;
 * five minutes later it asks again, up to five times. The old behaviour was to
 * fall silent after two minutes and record nothing, which meant a hard deadline
 * slept through was indistinguishable from one that never had an alarm.
 *
 * The notification carries Done and the FIRST snooze interval only. A
 * notification has room for two actions before Android starts hiding them, and
 * the full set of four is on the lock screen where there is room to aim.
 */
class AlarmService : Service() {

    companion object {
        const val CHANNEL = "cascade_alarm"
        const val NOTIF_ID = 4242
        const val ACTION_STOP = "com.cascade.alarm.STOP"
        var ringingId: String? = null; private set
    }

    private var player: MediaPlayer? = null
    private var vibrator: Vibrator? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) { stopSelf(); return START_NOT_STICKY }

        val id = intent?.getStringExtra("id") ?: run { stopSelf(); return START_NOT_STICKY }
        val alarm = AlarmStore.get(this, id) ?: run { stopSelf(); return START_NOT_STICKY }
        ringingId = id

        startForeground(NOTIF_ID, buildNotification(alarm))
        startSound()
        startVibration()

        // The hand-off. `ringSec` came from config through the payload; nothing
        // here decides how long two minutes is.
        android.os.Handler(mainLooper).postDelayed({
            if (ringingId == id) AlarmActionReceiver.handle(this, id, "AUTO")
        }, alarm.ringSec * 1000L)
        return START_NOT_STICKY
    }

    private fun buildNotification(alarm: AlarmStore.Alarm): Notification {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL, "Alarms", NotificationManager.IMPORTANCE_HIGH).apply {
                    setSound(null, null) // the service plays the sound, so it can loop
                    enableVibration(false)
                    setBypassDnd(true)
                    lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                }
            )
        }

        val full = PendingIntent.getActivity(
            this, 1,
            Intent(this, AlarmActivity::class.java)
                .putExtra("id", alarm.id)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        fun action(verb: String): PendingIntent = PendingIntent.getBroadcast(
            this, verb.hashCode(),
            Intent(this, AlarmActionReceiver::class.java)
                .setAction("com.cascade.alarm.$verb")
                .putExtra("id", alarm.id),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val first = alarm.snoozeOptions.firstOrNull() ?: alarm.autoSnoozeMin
        val b = if (Build.VERSION.SDK_INT >= 26)
            Notification.Builder(this, CHANNEL) else @Suppress("DEPRECATION") Notification.Builder(this)
        return b.setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(alarm.title)
            // The mobile sentence, built by the engine and carried in the payload.
            // The lock screen and the list row say the same thing about one task.
            .setContentText(alarm.reason.ifEmpty { "Cascade reminder" })
            .setCategory(Notification.CATEGORY_ALARM)
            .setOngoing(true)
            .setContentIntent(full)
            .setFullScreenIntent(full, true)
            .addAction(Notification.Action.Builder(null, "Snooze ${first}m", action("SNOOZE:$first")).build())
            .addAction(Notification.Action.Builder(null, "Done", action("DONE")).build())
            .build()
    }

    private fun startSound() {
        val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE) ?: return
        player = MediaPlayer().apply {
            setDataSource(this@AlarmService, uri)
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            isLooping = true
            setOnPreparedListener { it.start() }
            prepareAsync()
        }
    }

    private fun startVibration() {
        vibrator = if (Build.VERSION.SDK_INT >= 31)
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        else @Suppress("DEPRECATION") getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        val pattern = longArrayOf(0, 700, 500)
        if (Build.VERSION.SDK_INT >= 26)
            vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
        else @Suppress("DEPRECATION") vibrator?.vibrate(pattern, 0)
    }

    override fun onDestroy() {
        ringingId = null
        player?.run { runCatching { stop() }; release() }
        player = null
        vibrator?.cancel()
        super.onDestroy()
    }
}
