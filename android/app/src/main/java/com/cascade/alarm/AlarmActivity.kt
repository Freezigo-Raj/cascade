package com.cascade.alarm

import android.app.Activity
import android.app.KeyguardManager
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * The lock screen. Built in code rather than XML so the module drops into any
 * Capacitor project without resource merging.
 *
 * FIVE BUTTONS: Done, and one per snooze interval, all four arriving in the
 * payload. No Push. Moving a due date reads the day's load off every other task,
 * which needs the app running, so pushing needs an unlock and the app is where it
 * is done. Offering it here would mean either a fake button or a stale one.
 *
 * Done sits at the top because it is the only press that ends the task rather
 * than delaying it, and because a thumb reaching a lock screen at 6am aims high.
 */
class AlarmActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            getSystemService(KeyguardManager::class.java)?.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }

        val id = intent.getStringExtra("id") ?: run { finish(); return }
        val alarm = AlarmStore.get(this, id)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            // The R2 tokens: ink, paper, signal. Stated here as literals because
            // an Activity cannot read a stylesheet, and named in spec.md as the
            // one place the palette is duplicated.
            setBackgroundColor(Color.parseColor("#201e1d"))
            setPadding(56, 56, 56, 56)
        }

        root.addView(TextView(this).apply {
            text = alarm?.title ?: "Reminder"
            textSize = 26f
            setTextColor(Color.parseColor("#f5ead8"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        })
        // The sentence under the title, when the engine sent one. Nothing is drawn
        // in its place when it did not: an alarm with no reason is still an alarm.
        if (!alarm?.reason.isNullOrEmpty()) {
            root.addView(TextView(this).apply {
                text = alarm!!.reason
                textSize = 16f
                setTextColor(Color.parseColor("#c67139"))
                gravity = Gravity.CENTER
                setPadding(0, 12, 0, 0)
            })
        }
        root.addView(TextView(this).apply { text = ""; setPadding(0, 40, 0, 0) })

        fun bigButton(label: String, bg: String, verb: String, top: Int) = Button(this).apply {
            text = label
            textSize = 19f
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor(bg))
            setPadding(40, 30, 40, 30)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = top }
            setOnClickListener {
                AlarmActionReceiver.handle(this@AlarmActivity, id, verb)
                finish()
            }
        }

        root.addView(bigButton("Done", "#3d472b", "DONE", 0))

        // One button per interval, in config order. The row is built from the
        // payload, so changing the four numbers is a config edit and no more.
        val options = alarm?.snoozeOptions ?: listOf(5, 10, 30, 60)
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 28 }
        }
        for (m in options) {
            row.addView(Button(this).apply {
                text = "${m}m"
                textSize = 17f
                setTextColor(Color.WHITE)
                setBackgroundColor(Color.parseColor("#8c491a"))
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                    .apply { marginEnd = 12 }
                setOnClickListener {
                    AlarmActionReceiver.handle(this@AlarmActivity, id, "SNOOZE:$m")
                    finish()
                }
            })
        }
        root.addView(TextView(this).apply {
            text = "Snooze"
            textSize = 13f
            setTextColor(Color.parseColor("#eee7db"))
            setPadding(0, 32, 0, 0)
        })
        root.addView(row)

        setContentView(root)
    }
}
