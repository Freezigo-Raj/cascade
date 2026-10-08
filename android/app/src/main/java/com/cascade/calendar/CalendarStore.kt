package com.cascade.calendar

import android.content.Context
import org.json.JSONObject

/**
 * WHICH CALENDAR ROW BELONGS TO WHICH TASK.
 *
 * A task id is the app's, and the same everywhere. An event id is the Android
 * calendar provider's, and it is about one calendar on one device — a row id
 * from this phone means nothing on the next one and nothing at all in Supabase.
 * So the map lives here, in this phone's own storage, exactly as `AlarmStore`
 * holds what this phone has armed.
 *
 * It is also what makes the sync a DIFF rather than a rewrite: the web half
 * asks `list()` what is there, compares, and touches only what moved.
 *
 * IF THIS MAP IS EVER LOST — storage cleared, app reinstalled — nothing here
 * can tell that the events in the calendar came from Cascade, and a sync would
 * write a second copy of every one. That is the duplicate shape that cost
 * session 143. `CascadeCalendarPlugin` therefore looks for `cascade:<task id>`
 * in an event's description before inserting, and adopts the row it finds.
 */
object CalendarStore {

    private const val PREFS = "cascade_calendar"
    private const val MAP = "events"
    private const val CAL = "calendar_id"

    private fun prefs(c: Context) =
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun read(c: Context): JSONObject =
        runCatching { JSONObject(prefs(c).getString(MAP, "{}") ?: "{}") }
            .getOrDefault(JSONObject())

    private fun write(c: Context, o: JSONObject) {
        prefs(c).edit().putString(MAP, o.toString()).apply()
    }

    /** The provider row id for a task, or null. */
    fun eventIdFor(c: Context, taskId: String): Long? {
        val o = read(c)
        if (!o.has(taskId)) return null
        val v = o.optLong(taskId, -1L)
        return if (v > 0) v else null
    }

    /** Every pair, as task id to row id. */
    fun all(c: Context): Map<String, Long> {
        val o = read(c)
        val out = HashMap<String, Long>()
        val keys = o.keys()
        while (keys.hasNext()) {
            val k = keys.next()
            val v = o.optLong(k, -1L)
            if (v > 0) out[k] = v
        }
        return out
    }

    fun remember(c: Context, taskId: String, eventId: Long) {
        val o = read(c)
        o.put(taskId, eventId)
        write(c, o)
    }

    fun forget(c: Context, taskId: String) {
        val o = read(c)
        o.remove(taskId)
        write(c, o)
    }

    fun forgetAll(c: Context) {
        write(c, JSONObject())
    }

    /** The calendar the person chose on the account screen, or 0 for none yet. */
    fun calendarId(c: Context): Long = prefs(c).getLong(CAL, 0L)

    fun setCalendarId(c: Context, id: Long) {
        prefs(c).edit().putLong(CAL, id).apply()
    }
}
