# -*- coding: utf-8 -*-
"""HOW MUCH OF THE SCREEN IS TASKS. A tool, not a check.
=======================================================

His rule, session 139, from two phone screenshots: AT LEAST 70% OF THE VIEWPORT
HEIGHT BELONGS TO TASKS. Everything above the first row — header, tabs, search,
the slot toggle, the group heading — is a budget of 30vh.

This loads the REAL app in a headless browser at four phone sizes, seeds a few
overdue tasks into localStorage, and measures where the first row starts. It is
how the number in `mvp.css` was arrived at and how it can be checked again.

IT IS NOT ONE OF THE CHECKS AND IT IS NOT IN THE RUN LINE, deliberately. It
needs `pip install playwright && playwright install chromium`, which is a large
install for one measurement, and his standing call is that the screens are read
on the phone rather than by a harness. Run it when a header changes and you want
the number rather than an opinion:

    pip install playwright
    playwright install chromium
    python3 tools/measure_layout.py .

Baseline before session 139, on the same four sizes:  51.6  59.1  65.1  62.6 %
After:                                                71.3  74.1  76.9  75.6 %

The two middle sizes are his own phones. The screenshots he sent are 587x1280
and 702x1568, which are 1080x2356 and 1440x3216 downscaled; at their device
pixel ratios that is a CSS viewport of about 360x785 and 412x915.

NOTE: it points a plain HTTP server at whatever directory you pass and expects
`env.js` to be UNCONFIGURED, so the app runs on localStorage instead of asking
for a sign-in. Copy the tree, blank the two strings in `shell/env.js`, and point
this at the copy.
"""
import json,sys,threading,http.server,socketserver,functools,os
from playwright.sync_api import sync_playwright
ROOT=sys.argv[1]; 
PORT=8123
h=functools.partial(http.server.SimpleHTTPRequestHandler,directory=ROOT)
socketserver.TCPServer.allow_reuse_address=True
srv=socketserver.TCPServer(("",PORT),h)
threading.Thread(target=srv.serve_forever,daemon=True).start()

TASKS=[("Send cost of ownership to Dishit",-3),("Alpesh loan. 40000/6000",-2),
       ("Kena laptop update",-1),("Purchase material",-4),("Airtel sim purchase",-5),
       ("Purchase trimmer",-6),("Send comparision data Dishit",-2)]
def seed():
    import datetime
    out=[]
    now=datetime.datetime(2026,8,25,17,59)
    for i,(t,d) in enumerate(TASKS):
        due=(now+datetime.timedelta(days=d)).strftime("%Y-%m-%dT%H:%M:%S+05:30")
        out.append(("cascade:task:t%d"%i, json.dumps({
          "id":"t%d"%i,"raw_text":t,"title":t,"normalised":t.lower(),
          "due_at":due,"due_at_offset":"+05:30","earliest_start":"","earliest_start_offset":"",
          "date_precision":"day","date_anchor":"window","date_firmness":"normal","has_time":False,
          "action_verb":"send","verb_phrase":"send","commitment_type":"action","context":"phone",
          "est_duration_min":15,"significance":30,"task_state":"ready","archived":False,"pinned":False,
          "created_at":"2026-08-20T10:00:00+05:30","created_at_offset":"+05:30",
          "updated_at":"2026-08-20T10:00:00+05:30","updated_at_offset":"+05:30",
          "config_version":"a.19","recurrence":None,"alarm_type":"none","push_count":0,
          "first_due_at":"","notes_text":"","date_spans":[],"chip_spans":[],
          "type_source":"verb","duration_source":"default","closed_at":"","closed_at_offset":"",
          "blocked":False,"blocker_reason":"none","blocker_ref":"","readiness":"ready",
          "workflow_position":0,"spawned_from":None,"alarm_lead_min":None,
          "alarm_snoozed_until":"","alarm_unanswered_at":"","reminder_fatigue":0,
          "alarm_repeat_min":None,"recurrence_unit":None,"owner":"local"})))
    return out

SIZES=[("small 320x690",320,690),("phone1-ish 360x780",360,780),("phone2-ish 412x915",412,915),("tall 393x852",393,852)]
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,w,hgt in SIZES:
        ctx=b.new_context(viewport={"width":w,"height":hgt},device_scale_factor=2)
        pg=ctx.new_page()
        pg.goto("http://localhost:%d/"%PORT)
        pg.evaluate("""(rows)=>{for(const [k,v] of rows) localStorage.setItem(k,v);}""",seed())
        pg.reload(); pg.wait_for_timeout(1500)
        m=pg.evaluate("""()=>{
          const vh=window.innerHeight;
          const first=document.querySelector('.row');
          const q=(s)=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().height):null;};
          const top=first?Math.round(first.getBoundingClientRect().top+window.scrollY):null;
          const title=document.querySelector('.row .title');
          const slots=document.querySelector('.slots');
          return {vh, chromeTop:top, head:q('.head-block'), bar:q('.bar'), slots:q('.slots'),
                  groupHead:q('.group-head'), search:q('.search'),
                  slotsH:slots?Math.round(slots.getBoundingClientRect().height):null,
                  titleW:title?Math.round(title.getBoundingClientRect().width):null,
                  rowW:first?Math.round(first.getBoundingClientRect().width):null,
                  nudgesW:(()=>{const n=document.querySelector('.nudges');return n?Math.round(n.getBoundingClientRect().width):null})(),
                  barWrapped:(()=>{const b=document.querySelector('.bar');const s=document.querySelector('.search');
                    if(!b||!s)return null;return Math.round(s.getBoundingClientRect().top-b.getBoundingClientRect().top)>4})()};
        }""")
        if m["chromeTop"] is None:
            print("%-20s NO ROWS RENDERED"%name); ctx.close(); continue
        pct=100.0*(m["vh"]-m["chromeTop"])/m["vh"]
        print("%-20s vh=%d chrome=%dpx tasks=%.1f%%  head=%s bar=%s(wrapped=%s) slots=%s group=%s  title=%spx nudges=%spx row=%spx"%(
            name,m["vh"],m["chromeTop"],pct,m["head"],m["bar"],m["barWrapped"],m["slots"],m["groupHead"],m["titleW"],m["nudgesW"],m["rowW"]))
        ctx.close()
    b.close()
srv.shutdown()
