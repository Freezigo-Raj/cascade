package com.cascade.calendar

import android.content.ContentUris
import android.content.ContentValues
import android.content.pm.PackageManager
import android.provider.CalendarContract
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.util.TimeZone

/**
 * The JS surface. `shell/calendar.bridge.js` is the only caller.
 *
 *   CascadeCalendar.version()      -> { version }
 *   CascadeCalendar.permissions()  -> { read, write }
 *   CascadeCalendar.request()      — the runtime prompt for both
 *   CascadeCalendar.calendars()    -> { calendars: [{ id, name, account, primary }] }
 *   CascadeCalendar.list()         -> { events: [{ id, title, allDay, date,
 *                                                  startMs, endMs }] }
 *   CascadeCalendar.set({ id, title, description, allDay, date,
 *                         startMs, endMs, calendarId })
 *   CascadeCalendar.remove({ id })
 *   CascadeCalendar.clear()        — every event this app wrote, gone
 *   CascadeCalendar.readable()     -> { calendars: [...] }, everything readable
 *   CascadeCalendar.events({ fromMs, toMs, calendarIds })
 *                                  -> { events: [{ uid, title, description,
 *                                                  startMs, endMs, allDay,
 *                                                  selfStatus, calendarId }] }
 *
 * `id` IS ALWAYS THE TASK ID. The provider's own row id never crosses into
 * JavaScript: it is one calendar on one device, and `CalendarStore` is where it
 * belongs. Everything above speaks in task ids so the web half can diff what it
 * wants against what is there without knowing anything about Android.
 *
 * NO GOOGLE API IS CALLED HERE. The event goes into the local calendar
 * provider, on a calendar owned by a Google account, and Google's own sync
 * adapter carries it up. That is what buys this: no Cloud project, no consent
 * screen, no verification, no token to refresh, and it works with no signal.
 *
 * NOTHING IN THIS PROJECT COMPILES KOTLIN. `gate2.py` runs `tsc --strict` over
 * the web half and these files are read by no tool. Session 126 shipped a
 * second `companion object` in one class and it reached him as a build that
 * could not compile. This file has one companion, one class, and was checked by
 * hand — which is a statement about the care taken and not a compiler.
 */
@CapacitorPlugin(name = "CascadeCalendar")
class CascadeCalendarPlugin : Plugin() {

    companion object {
        /**
         * Stated once, and the account screen compares it to the number the
         * bridge was written against. The web half updates itself on every
         * open; this half only changes when the APK is rebuilt, so the two
         * drift by design and the app has to be able to see how far.
         */
        const val CALENDAR_BUILD = 2

        private const val PERM_REQUEST = 9101

        /**
         * Writable: contributor and above. Read-only subscriptions are not
         * offered, because offering one would mean every write failing with a
         * permission error that the person had already granted.
         *
         * `val` and not `const val` on purpose: a `const` has to be a
         * compile-time constant, and whether a Java `static final int` from the
         * platform counts as one is exactly the kind of thing nothing in this
         * project would catch, since no tool here compiles Kotlin.
         */
        val CAN_WRITE = CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
    }

    // ------------------------------------------------------------- permissions

    private fun granted(name: String): Boolean =
        context.checkSelfPermission(name) == PackageManager.PERMISSION_GRANTED

    private fun canRead(): Boolean = granted(android.Manifest.permission.READ_CALENDAR)

    private fun canWrite(): Boolean = granted(android.Manifest.permission.WRITE_CALENDAR)

    @PluginMethod
    fun version(call: PluginCall) {
        call.resolve(JSObject().put("version", CALENDAR_BUILD))
    }

    @PluginMethod
    fun permissions(call: PluginCall) {
        call.resolve(JSObject().put("read", canRead()).put("write", canWrite()))
    }

    /**
     * BOTH PERMISSIONS IN ONE PROMPT. Reading is not optional: writing alone
     * would let this app insert rows and never see them again, so every sync
     * would be an insert and the calendar would fill with copies. The diff is
     * the whole design, and the diff needs the read.
     */
    @PluginMethod
    fun request(call: PluginCall) {
        if (!canRead() || !canWrite()) {
            activity.requestPermissions(
                arrayOf(
                    android.Manifest.permission.READ_CALENDAR,
                    android.Manifest.permission.WRITE_CALENDAR
                ),
                PERM_REQUEST
            )
        }
        call.resolve()
    }

    // --------------------------------------------------------------- calendars

    @PluginMethod
    fun calendars(call: PluginCall) {
        if (!canRead()) return call.reject("calendar permission not granted")
        val out = JSArray()
        val cols = arrayOf(
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.ACCOUNT_TYPE,
            CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
            CalendarContract.Calendars.IS_PRIMARY
        )
        runCatching {
            context.contentResolver.query(
                CalendarContract.Calendars.CONTENT_URI, cols, null, null, null
            )?.use { c ->
                while (c.moveToNext()) {
                    val access = c.getInt(4)
                    if (access < CAN_WRITE) continue
                    out.put(
                        JSObject()
                            .put("id", c.getLong(0).toString())
                            .put("name", c.getString(1) ?: "")
                            .put("account", c.getString(2) ?: "")
                            .put("google", (c.getString(3) ?: "") == "com.google")
                            .put("primary", c.getInt(5) == 1)
                    )
                }
            }
        }
        call.resolve(JSObject().put("calendars", out))
    }

    /**
     * EVERY CALENDAR THIS PHONE CAN READ, for the tick list (session 148).
     *
     * `calendars()` above returns only the writable ones, because that list
     * answers a different question: where do tasks GO. This one answers where
     * events COME FROM, and that includes calendars nothing may write to —
     * Holidays, Birthdays, a colleague's shared calendar.
     *
     * HIS QUESTION ANSWERED HERE RATHER THAN IN A FIELD. There is no "type" on
     * a calendar row saying event or holiday or birthday: each of those IS its
     * own calendar, with its own name and its own account. So the tick list is
     * the answer, and `name` and `account` are what he ticks by.
     */
    @PluginMethod
    fun readable(call: PluginCall) {
        if (!canRead()) return call.reject("calendar permission not granted")
        val out = JSArray()
        val cols = arrayOf(
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.ACCOUNT_TYPE,
            CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
            CalendarContract.Calendars.IS_PRIMARY,
            CalendarContract.Calendars.VISIBLE
        )
        runCatching {
            context.contentResolver.query(
                CalendarContract.Calendars.CONTENT_URI, cols, null, null, null
            )?.use { c ->
                while (c.moveToNext()) {
                    out.put(
                        JSObject()
                            .put("id", c.getLong(0).toString())
                            .put("name", c.getString(1) ?: "")
                            .put("account", c.getString(2) ?: "")
                            .put("google", (c.getString(3) ?: "") == "com.google")
                            .put("writable", c.getInt(4) >= CAN_WRITE)
                            .put("primary", c.getInt(5) == 1)
                            .put("visible", c.getInt(6) == 1)
                    )
                }
            }
        }
        call.resolve(JSObject().put("calendars", out))
    }

    /**
     * EVERY OCCURRENCE IN A WINDOW, from the calendars he ticked.
     *
     * THE `Instances` TABLE AND NOT `Events`, and the difference is the whole
     * of how a repeating event works. `Events` holds one row for a weekly
     * standup with a recurrence rule on it; `Instances` is the provider
     * expanding that rule into one row per occurrence, with the exceptions and
     * the cancelled ones already applied. Reading `Events` would mean this app
     * re-implementing somebody else's recurrence rules, which is a thing nobody
     * gets right twice.
     *
     * WHICH occurrence becomes a task is decided in `calendar.import.js`, not
     * here: his rule is the next one he has not closed, and only the store
     * knows what he has closed. Kotlin hands over everything in the window and
     * states no policy, the same way the alarm plugin holds no timing number.
     *
     * `uid` is the stable identity, taken from the first of three that exists.
     * `UID_2445` is the iCalendar UID and is what Google's own sync adapter
     * writes; `_SYNC_ID` is the Google event id; the last resort is built from
     * the row and is correct on this phone only. `uidFrom` says which was used,
     * so a phone where the first two are empty says so rather than quietly
     * behaving differently.
     */
    @PluginMethod
    fun events(call: PluginCall) {
        if (!canRead()) return call.reject("calendar permission not granted")
        val fromMs = call.getLong("fromMs") ?: return call.reject("fromMs required")
        val toMs = call.getLong("toMs") ?: return call.reject("toMs required")
        val wanted = HashSet<String>()
        call.getArray("calendarIds")?.let { arr ->
            for (i in 0 until arr.length()) runCatching { wanted.add(arr.getString(i)) }
        }
        if (wanted.isEmpty()) return call.resolve(JSObject().put("events", JSArray()))

        val uri = CalendarContract.Instances.CONTENT_URI.buildUpon()
        ContentUris.appendId(uri, fromMs)
        ContentUris.appendId(uri, toMs)
        val cols = arrayOf(
            CalendarContract.Instances.BEGIN,
            CalendarContract.Instances.END,
            CalendarContract.Instances.TITLE,
            CalendarContract.Instances.ALL_DAY,
            CalendarContract.Instances.CALENDAR_ID,
            CalendarContract.Instances.DESCRIPTION,
            CalendarContract.Instances.SELF_ATTENDEE_STATUS,
            CalendarContract.Instances.STATUS,
            CalendarContract.Instances.EVENT_ID
        )
        val out = JSArray()
        runCatching {
            context.contentResolver.query(uri.build(), cols, null, null, null)?.use { c ->
                while (c.moveToNext()) {
                    val calId = c.getLong(4).toString()
                    if (!wanted.contains(calId)) continue
                    // A cancelled instance is a meeting that was called off. It
                    // is still in the table so that other devices learn it went.
                    if (c.getInt(7) == CalendarContract.Events.STATUS_CANCELED) continue
                    val eventId = c.getLong(8)
                    val uid = uidOf(eventId)
                    out.put(
                        JSObject()
                            .put("uid", uid.first)
                            .put("uidFrom", uid.second)
                            .put("startMs", c.getLong(0))
                            .put("endMs", c.getLong(1))
                            .put("title", c.getString(2) ?: "")
                            .put("allDay", c.getInt(3) == 1)
                            .put("calendarId", calId)
                            .put("description", c.getString(5) ?: "")
                            .put("selfStatus", c.getInt(6))
                    )
                }
            }
        }.onFailure { return call.reject("calendar read failed: ${it.message}") }
        call.resolve(JSObject().put("events", out))
    }

    /** The stable id of an event, and which of the three it came from. */
    private fun uidOf(eventId: Long): Pair<String, String> {
        val cols = arrayOf(
            CalendarContract.Events.UID_2445,
            CalendarContract.Events._SYNC_ID
        )
        var found: Pair<String, String>? = null
        runCatching {
            context.contentResolver.query(
                ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId),
                cols, null, null, null
            )?.use { c ->
                if (c.moveToFirst()) {
                    val ical = c.getString(0) ?: ""
                    val sync = c.getString(1) ?: ""
                    found = when {
                        ical.isNotEmpty() -> ical to "uid2445"
                        sync.isNotEmpty() -> sync to "syncid"
                        else -> null
                    }
                }
            }
        }
        // THE LAST RESORT IS CORRECT ON THIS PHONE ONLY, and says so. A row id
        // means nothing on the next device, so two phones would import the same
        // meeting as two different tasks. Stated rather than hidden: the account
        // screen prints which of the three was used.
        return found ?: ("row:$eventId" to "rowid")
    }

    /**
     * The calendar to write to: the one he chose, else the primary Google one,
     * else the first writable one there is.
     *
     * HIS ANSWER 3 was his main calendar rather than a separate `Cascade` one,
     * so the default has to be the one he actually looks at. `IS_PRIMARY` is
     * what the provider calls that, and it is only meaningful per account.
     */
    private fun targetCalendar(asked: Long): Long {
        if (asked > 0) return asked
        val remembered = CalendarStore.calendarId(context)
        if (remembered > 0) return remembered
        var first = 0L
        var primaryGoogle = 0L
        val cols = arrayOf(
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.ACCOUNT_TYPE,
            CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
            CalendarContract.Calendars.IS_PRIMARY
        )
        runCatching {
            context.contentResolver.query(
                CalendarContract.Calendars.CONTENT_URI, cols, null, null, null
            )?.use { c ->
                while (c.moveToNext()) {
                    if (c.getInt(2) < CAN_WRITE) continue
                    val id = c.getLong(0)
                    if (first == 0L) first = id
                    if (primaryGoogle == 0L &&
                        (c.getString(1) ?: "") == "com.google" && c.getInt(3) == 1
                    ) primaryGoogle = id
                }
            }
        }
        return if (primaryGoogle > 0) primaryGoogle else first
    }

    // ------------------------------------------------------------------ events

    /** Midnight UTC of a `YYYY-MM-DD`, which is what an all-day row wants. */
    private fun utcMidnight(date: String): Long {
        val parts = date.split("-")
        if (parts.size != 3) return 0L
        val cal = java.util.Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        cal.clear()
        cal.set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt(), 0, 0, 0)
        return cal.timeInMillis
    }

    private fun dateOfUtc(atMs: Long): String {
        val cal = java.util.Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        cal.timeInMillis = atMs
        val y = cal.get(java.util.Calendar.YEAR)
        val m = cal.get(java.util.Calendar.MONTH) + 1
        val d = cal.get(java.util.Calendar.DAY_OF_MONTH)
        return String.format("%04d-%02d-%02d", y, m, d)
    }

    /**
     * What this app put in the calendar, keyed by TASK id.
     *
     * A row the map names and the provider no longer has — he deleted it in
     * Google Calendar — is dropped from the map rather than reported, so the
     * next sync writes it again. That is what one way means, and the account
     * screen says it in words rather than leaving it to be noticed.
     */
    @PluginMethod
    fun list(call: PluginCall) {
        if (!canRead()) return call.reject("calendar permission not granted")
        val out = JSArray()
        for ((taskId, eventId) in CalendarStore.all(context)) {
            val row = readEvent(eventId)
            if (row == null) {
                CalendarStore.forget(context, taskId)
                continue
            }
            out.put(row.put("id", taskId))
        }
        call.resolve(JSObject().put("events", out))
    }

    private fun readEvent(eventId: Long): JSObject? {
        val cols = arrayOf(
            CalendarContract.Events.TITLE,
            CalendarContract.Events.DTSTART,
            CalendarContract.Events.DTEND,
            CalendarContract.Events.ALL_DAY,
            CalendarContract.Events.DELETED
        )
        var found: JSObject? = null
        runCatching {
            context.contentResolver.query(
                ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId),
                cols, null, null, null
            )?.use { c ->
                if (c.moveToFirst() && c.getInt(4) != 1) {
                    val allDay = c.getInt(3) == 1
                    val start = c.getLong(1)
                    // EMPTY AND ZERO RATHER THAN NULL. `JSObject.put` is
                    // overloaded on String, Long, Boolean and Object, and a
                    // Kotlin `String?` or a bare `null` makes that ambiguous at
                    // the call site. The web half reads `allDay` first and
                    // never looks at the field the other branch would have
                    // filled, so an empty string costs nothing and a compile
                    // error nothing here could catch costs a build.
                    found = JSObject()
                        .put("title", c.getString(0) ?: "")
                        .put("allDay", allDay)
                        .put("date", if (allDay) dateOfUtc(start) else "")
                        .put("startMs", if (allDay) 0L else start)
                        .put("endMs", if (allDay) 0L else c.getLong(2))
                }
            }
        }
        return found
    }

    /**
     * Insert or update one task's event.
     *
     * BEFORE INSERTING, IT LOOKS. `cascade:<task id>` sits in the description of
     * every row this app writes, so a map that was lost cannot become a second
     * copy of every event. One closed occurrence, one successor — the lesson of
     * session 143, applied here before it could cost anything.
     */
    @PluginMethod
    fun set(call: PluginCall) {
        if (!canWrite() || !canRead()) return call.reject("calendar permission not granted")
        val taskId = call.getString("id") ?: return call.reject("id required")
        val title = call.getString("title") ?: "(untitled)"
        val description = call.getString("description") ?: "From Cascade\ncascade:$taskId"
        val allDay = call.getBoolean("allDay") ?: false
        val asked = call.getString("calendarId")?.toLongOrNull() ?: 0L
        val calendarId = targetCalendar(asked)
        if (calendarId <= 0L) return call.reject("no writable calendar on this phone")
        if (asked > 0) CalendarStore.setCalendarId(context, asked)

        val values = ContentValues()
        values.put(CalendarContract.Events.CALENDAR_ID, calendarId)
        values.put(CalendarContract.Events.TITLE, title)
        values.put(CalendarContract.Events.DESCRIPTION, description)
        if (allDay) {
            val date = call.getString("date") ?: return call.reject("date required for an all-day event")
            val at = utcMidnight(date)
            if (at <= 0L) return call.reject("date must be YYYY-MM-DD")
            values.put(CalendarContract.Events.ALL_DAY, 1)
            values.put(CalendarContract.Events.DTSTART, at)
            values.put(CalendarContract.Events.DTEND, at + 86400000L)
            // An all-day row is a DATE and not an instant, and the provider
            // expects UTC midnight with this said out loud. Anything else and
            // the banner lands a day early or late depending on the zone.
            values.put(CalendarContract.Events.EVENT_TIMEZONE, "UTC")
        } else {
            val start = call.getLong("startMs") ?: return call.reject("startMs required")
            val end = call.getLong("endMs") ?: (start + 1800000L)
            values.put(CalendarContract.Events.ALL_DAY, 0)
            values.put(CalendarContract.Events.DTSTART, start)
            values.put(CalendarContract.Events.DTEND, end)
            values.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().id)
        }

        val known = CalendarStore.eventIdFor(context, taskId) ?: adopt(taskId)
        runCatching {
            if (known != null && readEvent(known) != null) {
                context.contentResolver.update(
                    ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, known),
                    values, null, null
                )
                CalendarStore.remember(context, taskId, known)
            } else {
                val uri = context.contentResolver.insert(CalendarContract.Events.CONTENT_URI, values)
                val id = uri?.lastPathSegment?.toLongOrNull()
                if (id != null && id > 0) CalendarStore.remember(context, taskId, id)
            }
        }.onFailure { return call.reject("calendar write failed: ${it.message}") }
        call.resolve()
    }

    /** A row already carrying this task's marker, for a map that was lost. */
    private fun adopt(taskId: String): Long? {
        val cols = arrayOf(CalendarContract.Events._ID, CalendarContract.Events.DELETED)
        var found: Long? = null
        runCatching {
            context.contentResolver.query(
                CalendarContract.Events.CONTENT_URI,
                cols,
                "${CalendarContract.Events.DESCRIPTION} LIKE ?",
                arrayOf("%cascade:$taskId%"),
                null
            )?.use { c ->
                while (c.moveToNext()) {
                    if (c.getInt(1) == 1) continue
                    found = c.getLong(0)
                    break
                }
            }
        }
        if (found != null) CalendarStore.remember(context, taskId, found!!)
        return found
    }

    @PluginMethod
    fun remove(call: PluginCall) {
        if (!canWrite()) return call.reject("calendar permission not granted")
        val taskId = call.getString("id") ?: return call.reject("id required")
        val eventId = CalendarStore.eventIdFor(context, taskId)
        if (eventId != null) {
            runCatching {
                context.contentResolver.delete(
                    ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId),
                    null, null
                )
            }
        }
        CalendarStore.forget(context, taskId)
        call.resolve()
    }

    /**
     * Every event this app wrote, gone. The switch on the account screen calls
     * it: a switch that stops adding and leaves what it already added is not a
     * switch, it is a one-way door.
     */
    @PluginMethod
    fun clear(call: PluginCall) {
        if (!canWrite()) {
            CalendarStore.forgetAll(context)
            return call.resolve()
        }
        for ((taskId, eventId) in CalendarStore.all(context)) {
            runCatching {
                context.contentResolver.delete(
                    ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId),
                    null, null
                )
            }
            CalendarStore.forget(context, taskId)
        }
        CalendarStore.forgetAll(context)
        call.resolve()
    }
}
