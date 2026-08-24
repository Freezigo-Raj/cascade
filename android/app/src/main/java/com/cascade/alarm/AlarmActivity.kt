package com.cascade.alarm

import android.app.Activity
import android.app.KeyguardManager
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.WindowManager
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.widget.Button
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import java.util.Calendar

/**
 * The lock screen. Built in code rather than XML so the module drops into any
 * Capacitor project without resource merging.
 *
 * THREE ROWS: Done, the snooze intervals, and the push targets. All of them
 * arrive in the payload; nothing here decides a number or a date.
 *
 * DONE AND A PUSH BRING THE APP FORWARD, which means the phone asks to be
 * unlocked. A snooze does not. Both are queued either way, so the unlock is what
 * makes the change visible rather than what makes it happen. A snooze changes
 * nothing about the task and has nothing to show.
 *
 * It also answers a `verb` extra without drawing anything, so a Done pressed in
 * the notification shade takes exactly the same path as one pressed here.
 *
 * The push targets were computed when the alarm was armed, because choosing one
 * reads the day's load off every stored task and this process has none. They are
 * therefore as old as the gap between arming and ringing. That is the cost of
 * having them here at all, and the alternative was making a push need an unlock.
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

        // A verb handed in directly, drawing nothing. Nothing in the app sends
        // one any more — the notification's buttons are broadcasts again, so a
        // press stops the ringing without waiting for a keyguard — and this path
        // is kept because it costs four lines and is the only way to drive this
        // screen from a test or from a future surface that has an activity in
        // hand already.
        val straight = intent.getStringExtra("verb")
        if (straight != null) {
            AlarmActionReceiver.handle(this, id, straight)
            finish()
            return
        }

        val alarm = AlarmStore.get(this, id)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            // THE SAME GROUND AS THE APP (session 125, his words: "UI for
            // alarm needs to be same colour/theme"). This screen was ink on
            // dark while every other screen is paper, so the one surface a
            // person meets half asleep was the one surface that did not look
            // like the app. Paper, ink and signal, the R2 tokens, stated here
            // as literals because an Activity cannot read a stylesheet — and
            // named in spec.md as the one place the palette is duplicated.
            setBackgroundColor(Color.parseColor("#f5ead8"))
            setPadding(56, 56, 56, 56)
        }

        root.addView(TextView(this).apply {
            text = alarm?.title ?: "Reminder"
            textSize = 26f
            setTextColor(Color.parseColor("#201e1d"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        })
        // The sentence under the title, when the engine sent one. Nothing is drawn
        // in its place when it did not: an alarm with no reason is still an alarm.
        if (!alarm?.reason.isNullOrEmpty()) {
            root.addView(TextView(this).apply {
                text = alarm!!.reason
                textSize = 16f
                setTextColor(Color.parseColor("#8c491a"))
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
                // `handle` stops the ringing and queues the press, and then
                // brings the app forward on its own. Nothing here waits.
                AlarmActionReceiver.handle(this@AlarmActivity, id, verb)
                finish()
            }
        }

        root.addView(bigButton("Done", "#3d472b", "DONE", 0))  // `good`, the one dark block

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
                    // No `surface`. A snooze says something about the alarm and
                    // nothing about the task, so there is nothing to look at and
                    // the phone stays locked.
                    AlarmActionReceiver.handle(this@AlarmActivity, id, "SNOOZE:$m")
                    finish()
                }
            })
        }
        root.addView(TextView(this).apply {
            text = "Snooze"
            textSize = 13f
            setTextColor(Color.parseColor("#8c491a"))
            setPadding(0, 32, 0, 0)
        })
        root.addView(row)

        // The push targets, when the payload carried any. A task with no date to
        // move, or one armed before the app could compute them, draws no row at
        // all rather than a button that would have to invent a date.
        //
        // IT SCROLLS SIDEWAYS NOW (session 128, his slide: "give more options
        // with scroll"). The row used to share its width between two buttons;
        // five equal slices on a phone are five unreadable ones, so each button
        // takes the width its label needs and the row scrolls past the edge.
        val pushes = alarm?.pushTargets ?: emptyList()
        if (pushes.isNotEmpty()) {
            root.addView(TextView(this).apply {
                text = "Move it to"
                textSize = 13f
                setTextColor(Color.parseColor("#8c491a"))
                setPadding(0, 28, 0, 0)
            })
            val prow = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
            }
            for ((label, iso) in pushes) {
                prow.addView(Button(this).apply {
                    text = label
                    textSize = 16f
                    setTextColor(Color.parseColor("#201e1d"))
                    setBackgroundColor(Color.parseColor("#eee7db"))
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    ).apply { marginEnd = 12 }
                    setOnClickListener {
                        AlarmActionReceiver.handle(this@AlarmActivity, id, "PUSH:$iso")
                        finish()
                    }
                })
            }
            // PICK A DATE AND A TIME (session 128, his slide: "need ability to
            // select time and date as well here"). The rungs are the fast
            // answers and this is the exact one, at the end of the same row
            // because it answers the same question.
            //
            // IT IS THE ONE PLACE THIS SHELL COMPOSES A DATE, and it does it
            // the way the store does: local wall clock, with the device's own
            // offset written on the end, never epoch milliseconds — a due date
            // is a local instant and rebuilding one from epoch drops the zone.
            prow.addView(Button(this).apply {
                text = "Pick…"
                textSize = 16f
                setTextColor(Color.parseColor("#201e1d"))
                setBackgroundColor(Color.parseColor("#eee7db"))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                setOnClickListener { pickDateAndTime(id) }
            })
            root.addView(HorizontalScrollView(this).apply {
                isHorizontalScrollBarEnabled = false
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { topMargin = 12 }
                addView(prow)
            })
        }

        // TWO CANCELS, AND THEY MEAN DIFFERENT THINGS (session 128, his slide).
        // `Cancel alarm` stops this ring and touches nothing else, so a repeat
        // rings again on its own schedule and a one-off simply goes quiet.
        // `Cancel this one` / `Cancel task` closes the occurrence itself as
        // cancelled — not done, because it was not done — and a repeat is given
        // its next occurrence straight away, so calling off tonight's run does
        // not end the habit. The wording follows `repeats`, which the payload
        // carries because this shell cannot see the record.
        val small = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 28 }
        }
        fun quietButton(label: String, verb: String) = Button(this).apply {
            text = label
            textSize = 14f
            setTextColor(Color.parseColor("#8c491a"))
            setBackgroundColor(Color.parseColor("#f5ead8"))
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            setOnClickListener {
                AlarmActionReceiver.handle(this@AlarmActivity, id, verb)
                finish()
            }
        }
        small.addView(quietButton("Cancel alarm", "DISMISS"))
        small.addView(
            quietButton(if (alarm?.repeats == true) "Cancel this one" else "Cancel task", "CANCEL")
        )
        root.addView(small)

        // THE SHELL SAYS WHICH BUILD IT IS (session 126, his slide: "add a
        // version number on this as well, if possible"). The web half updates
        // on every open and this half only when the APK is rebuilt, so a lock
        // screen that looks wrong is either an old APK or a real defect and
        // nothing on it could tell the two apart. `SHELL_BUILD` is the same
        // number `CascadeAlarmPlugin.version()` reports, stated once there and
        // read here, so the account screen and this screen cannot disagree.
        root.addView(TextView(this).apply {
            text = "alarm shell build ${CascadeAlarmPlugin.SHELL_BUILD}"
            textSize = 11f
            setTextColor(Color.parseColor("#8c491a"))
            setPadding(0, 48, 0, 0)
            gravity = android.view.Gravity.CENTER
        })

        setContentView(root)
    }

    /**
     * Date, then time, then a push. Two dialogs rather than one because Android
     * has no combined picker and a hand-built one would be this shell deciding
     * what a date looks like.
     *
     * The ringing has already stopped by the time either dialog opens — the
     * service is stopped when this screen appears — so a person can take as
     * long as they like over it in silence. Dismissing either dialog leaves the
     * task exactly where it was, which is the right answer to a change of mind.
     */
    private fun pickDateAndTime(id: String) {
        val c = Calendar.getInstance()
        DatePickerDialog(this@AlarmActivity, { _, year, month, day ->
            TimePickerDialog(this@AlarmActivity, { _, hour, minute ->
                val at = Calendar.getInstance().apply {
                    set(year, month, day, hour, minute, 0)
                    set(Calendar.MILLISECOND, 0)
                }
                AlarmActionReceiver.handle(this@AlarmActivity, id, "PUSH:" + isoLocal(at))
                finish()
            }, c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE), false).show()
        }, c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH)).show()
    }

    /**
     * `2026-08-21T14:30:00+05:30` — the shape every date in this app is stored
     * in: local wall clock, with the offset that was in force at that instant
     * written on the end. The offset is read from the calendar itself rather
     * than from the device's current zone, so a date picked either side of a
     * daylight change carries the right one.
     */
    private fun isoLocal(c: Calendar): String {
        val offMin = (c.get(Calendar.ZONE_OFFSET) + c.get(Calendar.DST_OFFSET)) / 60000
        val sign = if (offMin < 0) "-" else "+"
        val abs = kotlin.math.abs(offMin)
        return String.format(
            "%04d-%02d-%02dT%02d:%02d:00%s%02d:%02d",
            c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH),
            c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE),
            sign, abs / 60, abs % 60
        )
    }
}
