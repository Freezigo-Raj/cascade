# -*- coding: utf-8 -*-
"""Gate 2, both directions. Every count is read from a file, never from prose.

  contract.md  <->  types.ts  <->  config.ts        item-for-item, all four groups
  example.md    ->  contract.md                     every field and config name used
  contract.md   ->  example.md                      every item demonstrated, or excused
  config.ts     ->  itself                          every vocabulary member reachable,
                                                    mapped, and mapped into its own set
  answer_key.md ->  itself                          every reconciled row declared
  spec.md       ->  reality                          versions and counts it claims

NOT CHECKED ANY MORE (session 137): the ASCII panels. `example.md` drew the
screen in box characters, and this file measured the drawing — every fragment
against a template, every badge against the task table, every box corner, every
panel's right edge. The drawing was of a layout three redesigns old and no
person ever opened it. The rendered STRINGS still matter and are still held to
the contract by the Example-value check below; the picture is gone.
"""
import io,os,re,sys,glob,shutil,subprocess

C=io.open('contract.md',encoding='utf-8').read()
T=io.open('types.ts',encoding='utf-8').read()
E=io.open('example.md',encoding='utf-8').read()
F=io.open('config.ts',encoding='utf-8').read()
S=io.open('spec.md',encoding='utf-8').read()
K=io.open('answer_key.md',encoding='utf-8').read()
fails=[]
warns=[]
def bad(m): fails.append(m)

# ---------- readers ----------
def iface(name):
    m=re.search(r'export interface %s \{(.*?)\n\}'%name,T,re.S)
    return re.findall(r'^  (\w+)[?]?:',m.group(1),re.M) if m else []
def alias_names():
    return re.findall(r'^export type ([a-z_]+) =',T,re.M)
def section(start,stop,src=None):
    m=re.search(re.escape(start)+r'(.*?)'+stop,src if src is not None else C,re.S)
    return m.group(1) if m else ''
def names(start,stop):
    return re.findall(r'^\| `(\w+)`',section(start,stop),re.M)

inputs  = names('# 1. Inputs','# 2. Working values')
working = names('# 2. Working values','# 3. Outputs')
task_c  = names('## 3a. `Task`','### Values with no instance')
undo_c  = names('## 3b. `UndoEntry`', r'\n---\n')
shown   = names('# 4. Outputs — shown','# 5. Cross-field')
cfg_c   = names('# 6. Config','## Duplicate detection')
# Two columns: item, then the value with no instance. An empty value column
# excuses the whole item; a filled one excuses only that value.
_ex=re.findall(r'^\| `([^|`]+)` \| `?([^|`]*)`?\s*\|',
               section('### Values with no instance','All are Stage 4'),re.M)
excused=[i for i,v in _ex if not v.strip()]
# A row with a value excuses only that value, which the Example check below
# handles by item name; nothing needs the pairs separately.

task_t = iface('Task')
cfg_t   = [k for k in iface('Config') if k!='version']
inp_t   = iface('CaptureInput')
wv_t    = iface('WorkingValues')
# `ResultRow` and `ResultGroup` hold two shown outputs each. Reading only the
# three top-level views missed them the session search arrived, and the gate
# reported them as contract-only rather than as a reader that stopped short.
shown_t = (iface('ListView')+iface('CardView')+iface('CaptureView')
           +iface('ResultRow')+iface('ResultGroup')+iface('PushOption')
           +iface('AlarmView')+alias_names())
cfg_a   = [k for k in re.findall(r'^  ([a-z_]+):',
           re.search(r'partAConfig: Config = \{(.*)\n\};',F,re.S).group(1),re.M) if k!='version']

def both(label,a,an,b,bn):
    for x in a:
        if x not in b: bad('%s: `%s` in %s, missing from %s'%(label,x,an,bn))
    for x in b:
        if x not in a: bad('%s: `%s` in %s, missing from %s'%(label,x,bn,an))

# ---------- 1. contract <-> types <-> config ----------
both('Inputs',inputs,'contract',inp_t,'types')
both('WorkingValues',working,'contract',wv_t,'types')
both('Task',task_c,'contract',task_t,'types')
both('Shown',shown,'contract',shown_t,'types')          # the check that was missing

# UNDO IS DELETED FROM THE DOCUMENTS (session 137) and the table is left standing
# in schema.sql for the workflow work. A name coming back into the contract or
# the machine half without the table's shape being redesigned is a feature
# reappearing by copy-paste, so it is named here rather than left to a reading.
# Declarations and table rows only. Prose naming a deleted thing is the record:
# the contract has to be able to say what was removed and why.
for _n in ('UndoEntry','UndoAction','undo_toast'):
    if re.search(r'^export (?:type|interface) %s\b'%_n,T,re.M):
        bad('types.ts still declares `%s`; undo was deleted in session 137'%_n)
    if re.search(r'^\| `%s` \|'%_n,C,re.M):
        bad('contract.md still gives `%s` a contract row; undo was deleted in session 137'%_n)
if re.search(r'^\| `row_action`.*`undo`',C,re.M):
    bad('contract.md still lists `undo` as a row_action member')
both('Config',cfg_c,'contract',cfg_t,'types')
both('Config',cfg_t,'types',cfg_a,'config.ts')

# The shape resolve() returns is neither saved nor shown, so it sits outside the
# five groups and needs its own comparison. Session 30 found it unnamed.
ro_c=re.findall(r'^- `(\w+)` —',section(r'## What `resolve()` returns','# 5. Cross-field'),re.M)
if not ro_c: bad('contract names no return shape for resolve()')
both('ResolveOutput',ro_c,'contract',iface('ResolveOutput'),'types')

# ---------- 1b. config is internally live ----------
# Every vocabulary member must be reachable from the lexicon and carry its
# downstream mappings. A member nothing can produce is dead code, and adding
# eleven of them is how this check came to exist.
def obj(name):
    m=re.search(name+r': \{(.*?)\n  \},',F,re.S)
    return m.group(1) if m else ''
members=set(re.findall(r'"(\w+)"',re.search(r'action_verbs: \[(.*?)\]',F,re.S).group(1)))
reach=set(v for _,v in re.findall(r'(\w+): "(\w+)"',obj('verb_lexicon')))
for m in sorted(members-reach):
    bad('config: `%s` is an action_verbs member no verb_lexicon entry can produce'%m)
for m in sorted(reach-members):
    bad('config: verb_lexicon maps to `%s`, which is not an action_verbs member'%m)
# The contract names objects; config.ts lists members. A member list written in
# both places is one concept with two spellings, and this one went stale the
# session action_verbs grew from seven to eighteen.
_voc={'action_verbs':members,
      'contexts':set(re.findall(r'"(\w+)"',re.search(r'contexts: \[(.*?)\]',F,re.S).group(1))),
      'commitment_types':set(re.findall(r'"(\w+)"',re.search(r'commitment_types: \[(.*?)\]',F,re.S).group(1)))}
for _row in re.findall(r'^\| `(\w+)` \| member list \| ([^|]*)\|',section('# 6. Config','## Duplicate detection'),re.M):
    _name,_cell=_row
    if _name not in _voc: continue
    _toks={t for t in re.findall(r'`([a-z_]+)`',_cell) if t not in cfg_a}
    if len(_toks)>=2 and _toks!=_voc[_name]:
        bad('contract enumerates %s as %s; config.ts has %d members'
            %(_name,' '.join(sorted(_toks)),len(_voc[_name])))

for tbl in ['verb_to_type','duration_defaults']:
    keys=set(re.findall(r'(\w+):',obj(tbl)))-{'other'}
    for m in sorted(members-keys):
        bad('config: `%s` has no %s entry'%(m,tbl))
    for k in sorted(keys-members):
        bad('config: %s has an entry for `%s`, which is not a member'%(tbl,k))

# THE CHECK THE KEY WAS DOING BY ACCIDENT (session 137). Section A stated
# `commitment_type`, `context` and `est_duration_min` for all 33 verbs, which is
# `config.verb_to_type[v]`, `config.verb_to_context[v]` and
# `config.duration_defaults[v]` copied by hand into a second file. It tested that
# two copies of one table agreed and went red whenever a number changed with no
# defect present. The columns are gone. What they were worth is this: every
# mapping has to land INSIDE its own vocabulary, and `verb_to_context` — the one
# deliberately partial table — must not carry an entry for a verb that is not a
# member. A value outside its vocabulary is a record the store will not accept.
for _tbl,_vocab in [('verb_to_type','commitment_types'),('verb_to_context','contexts')]:
    for _k,_v in re.findall(r'(\w+): "(\w+)"',obj(_tbl)):
        if _k!='other' and _k not in members:
            bad('config: %s maps `%s`, which is not an action_verbs member'%(_tbl,_k))
        if _v not in _voc[_vocab]:
            bad('config: %s maps `%s` to `%s`, which is not a %s member'%(_tbl,_k,_v,_vocab))
for _k,_v in re.findall(r'(\w+): (\d+)',obj('duration_defaults')):
    if int(_v)<=0: bad('config: duration_defaults.%s is %s; the contract says duration is positive'%(_k,_v))

# ---------- 2. example -> contract, discovered not hardcoded ----------
for f in re.findall(r'^\| `(\w+)`',
        re.search(r'## 3\. What was stored.*?Thirty-seven',E,re.S).group(0),re.M):
    if f not in task_c: bad('example field `%s` has no contract item'%f)
for k in set(re.findall(r'`config\.([a-z_.]+)`',E)):
    if k.split('.')[0] not in cfg_a: bad('example names `config.%s`, absent from config.ts'%k)
# ---------- 3. contract -> example ----------
# Each item states an Example value. That value must appear on the example,
# or the item must be listed with a written reason. Backticked-name presence is
# not enough: an item can be named in prose and never demonstrated.
def examples(start,stop,col):
    out={}
    for row in re.findall(r'^\|(.+)\|\s*$',section(start,stop),re.M):
        cells=[c.strip() for c in row.split('|')]
        if len(cells)>col and cells[0].startswith('`'):
            out[cells[0].strip('`')]=cells[col].strip('`*() ')
    return out
excused_txt=' '.join(excused)  # exact item names only
for start,stop,col in [('# 1. Inputs','# 2. Working values',5),
                       ('# 2. Working values','# 3. Outputs',4),
                       ('# 4. Outputs — shown','# 5. Cross-field',3),
                       ('## 3a. `Task`','### Values with no instance',5)]:
    for item,ex in examples(start,stop,col).items():
        if item in excused or not ex or ex in ('—','none','empty'): continue
        if ex not in E:
            bad('contract item `%s` gives Example %r, which is not on the example'%(item,ex))

# ---------- 3a3. a reconciled key row is declared ----------
#
# The answer key opens by claiming every value in it was written by hand from
# the contract before any logic existed. That claim has always had exceptions:
# rows edited to agree with the engine after the engine already ran. A
# reconciled row cannot catch the engine it was copied from, and four of them
# said so only in a Note cell where nobody counts them.
#
# Session 137 gave them a home. Any row whose note admits a reconciliation must
# have its case id in RECONCILED ROWS, or the claim at the top of the key is
# false and nothing says so.
_REC=re.compile(r'what the engine does|reconciled|fitted rather than derived|[Cc]orrected at version',re.I)
_recblk=section('## RECONCILED ROWS','\n## ',K)
if not _recblk:
    bad('answer_key.md has no RECONCILED ROWS block; a row fitted to the engine has nowhere to be declared')
else:
    _declared=set(re.findall(r'\b[A-I]\d+\b',_recblk))
    for _ln in K.split('\n'):
        if _ln.startswith('|') and _recblk.find(_ln)>=0: continue
        if not _REC.search(_ln): continue
        _ids=set(re.findall(r'\b[A-I]\d+\b',_ln))
        if not _ids: continue
        for _id in sorted(_ids-_declared):
            bad('answer_key.md: %s reads as reconciled to the engine and is not in RECONCILED ROWS'%_id)

# ---------- 3b. the decision log is append-only ----------
# A hash per dated entry, in order. New entries may be appended; an existing
# one that changes breaks its hash. Session 25 rewrote six of them with a blind
# regex, which is the defect this check exists for.
import hashlib
_log=[l for l in S.split('\n') if re.match(r'^- \d+ \w+ 2026 — ',l)]
_now=[hashlib.sha1(l.encode()).hexdigest()[:12] for l in _log]
try:
    _was=[h for h in io.open('log.manifest',encoding='utf-8').read().split('\n') if h]
except OSError:
    _was=None; bad('log.manifest is missing; the decision log is unprotected')
if '--seal' in sys.argv:
    io.open('log.manifest','w',encoding='utf-8').write('\n'.join(_now)+'\n')
    print('sealed %d log entries'%len(_now)); sys.exit(0)
# Membership, not position. An entry appended to the log rather than to the end
# of the file shifts every hash after it, and a positional compare called that
# an edit. What append-only actually says is that no sealed hash ever leaves.
if _was is not None:
    gone=[h for h in _was if h not in set(_now)]
    fresh=[l for l,h in zip(_log,_now) if h not in set(_was)]
    if gone:
        bad('%d sealed decision-log entries are gone; the log is append-only'%len(gone))
        for l in fresh[:3]: bad('  unsealed entry, one of these is the edit: %r'%l[:90])
    elif fresh:
        warns.append('%d new log entries are unprotected; run `python3 gate2.py --seal`'%len(fresh))

# ---------- 4. spec.md claims ----------
vb=re.search(r'## VERSIONS\n(.*?)\n\n',S,re.S)
if not vb: bad('spec.md has no VERSIONS block')
else:
    stated=dict(re.findall(r'^\s*(\S+)\s+(\S+)\s*$',vb.group(1),re.M))
    # Only the dated log lines are exempt. Slicing from the first one to EOF
    # left DELIBERATE DEVIATIONS and everything after it unchecked.
    body='\n'.join(l for l in (S[:vb.start()]+S[vb.end():]).split('\n')
                   if not re.match(r'^- \d+ \w+ 2026 — ',l))
    for stray in re.findall(r'\bv(\d+)\b|version (\d+)|`?a\.(\d+)`?',body):
        s2=[x for x in stray if x]
        if s2: bad('spec.md repeats a version (%s) outside the VERSIONS block'%s2[0])
ev=re.search(r'Stage 1 deliverable, version (\d+)',E).group(1)
cv=re.search(r'Stage 2 deliverable, version (\d+)',C).group(1)
gv=re.search(r'version: "([^"]+)"',F).group(1)
kv=re.search(r'Stage 4 deliverable, version (\d+)',K).group(1)
# The shell states its own number in shell/version.js. It lived in render.js
# until render.js was deleted with the rest of the Stage 3 harness; six other
# numbers are held to it below, so it needs a home that is nothing else.
try:
    _R=io.open('shell/version.js',encoding='utf-8').read()
    _m=re.search(r'export const SHELL_VERSION = (\d+);',_R)
    sv=_m.group(1) if _m else None
    if sv is None: bad('shell/version.js states no SHELL_VERSION; six other numbers have nothing to be held to')
except IOError:
    sv=None; bad('shell/version.js is missing')
# The stylesheet is loaded from a static link, so it cannot carry a date the way
# every module does. It carries the shell version instead, in the link in
# index.html and the five @import lines inside mvp.edit.css. A number a person
# has to remember to bump is a number that goes stale, and this one going stale
# means a whole session's design never reaching a browser. So it is read rather
# than trusted.
#
# The link is now ALSO repaired at runtime: `mvp.js` re-points it at
# SHELL_VERSION when the loaded sheet is behind, because index.html is the one
# file with no cache-buster of its own and a browser serving a cached page loads
# the previous version's stylesheet from a link nothing can bump. The gate still
# reads every number here. A repair that runs is not a reason to stop checking
# what it repairs: the repository being right is what makes the first paint right,
# and the repair only rescues the second.
# The stylesheet also states its own version in a token the app reads at runtime,
# and a token that disagrees with SHELL_VERSION makes the app accuse the browser
# of serving something old when the repository is what disagrees. Two numbers in
# two files, so the gate holds them together like it holds the queries.
if sv:
    try:
        _MC=io.open('shell/mvp.css',encoding='utf-8').read()
        _m2=re.search(r'--css-version:\s*(\d+)', _MC)
        if not _m2: bad('shell/mvp.css states no --css-version; the app cannot tell a stale stylesheet from a fresh one')
        elif _m2.group(1)!=sv: bad('shell/mvp.css says --css-version %s, SHELL_VERSION is %s'%(_m2.group(1),sv))
    except IOError: bad('shell/mvp.css is missing')

if sv:
    _css_refs=[]
    try:
        _H=io.open('index.html',encoding='utf-8').read()
        _css_refs+= [('index.html',m) for m in re.findall(r'mvp\.edit\.css(?:\?v=(\d+))?', _H)]
    except IOError: bad('index.html is missing')
    try:
        _EC=io.open('shell/mvp.edit.css',encoding='utf-8').read()
        _css_refs+= [('shell/mvp.edit.css',m) for m in re.findall(r'@import url\("\./[a-z.]+\.css(?:\?v=(\d+))?"\)', _EC)]
    except IOError: bad('shell/mvp.edit.css is missing')
    for where,got in _css_refs:
        if not got: bad('%s loads a stylesheet with no ?v= query; a cached copy of it is a whole session that never arrived'%where)
        elif got!=sv: bad('%s loads a stylesheet at v=%s, SHELL_VERSION is %s'%(where,got,sv))
    # The module import is pinned the same way (session 119). `Date.now()` there
    # made every launch a cold download of the whole graph; a stale pin would be
    # the stylesheet defect in the other file type.
    _mj=re.search(r'shell/mvp\.js\?v=(\d+)', _H) if '_H' in dir() else None
    if not _mj: bad('index.html does not import shell/mvp.js under ?v=<SHELL_VERSION>; either it is cold on every launch or it can go stale')
    elif _mj.group(1)!=sv: bad('index.html imports mvp.js at v=%s, SHELL_VERSION is %s'%(_mj.group(1),sv))

for key,real in [('example',ev),('contract',cv),('config',gv),('answer_key',kv)]+([('shell',sv)] if sv else []):
    m=re.search(r'^\s*%s\s+(\S+)\s*$'%key,vb.group(1),re.M) if vb else None
    if not m: bad('VERSIONS block does not state %s'%key)
    elif m.group(1)!=real: bad('VERSIONS says %s %s, actual %s'%(key,m.group(1),real))
for m,real,what in [(re.search(r'(\d+) inputs',S),len(inputs),'inputs'),
                    (re.search(r'(\d+) working values',S),len(working),'working values'),
                    (re.search(r'(\d+) rendered outputs',S),len(shown),'rendered outputs'),
                    (re.search(r'config at (\d+) objects',S),len(cfg_a),'config objects')]:
    if m and int(m.group(1))!=real: bad('spec.md claims %s %s, actual %d'%(m.group(1),what,real))
for f,txt in [('contract.md',C),('types.ts',T),('example.md',E),('answer_key.md',K)]:
    for m in re.finditer(r'[Cc]ompanion to[^\n]*?\bv(\d+)\b',txt):
        bad('%s states a companion version (%s); VERSIONS in spec.md is the only place'%(f,m.group(0)))
_cases=set(re.findall(r'\b[A-I]\d+\b',K))
for m in re.finditer(r'(\d+) key cases',S):
    if int(m.group(1))!=len(_cases):
        bad('spec.md claims %s key cases, answer_key.md declares %d'%(m.group(1),len(_cases)))

for m in re.finditer(r'the (\d+) config objects',S):
    if int(m.group(1))!=len(cfg_a): bad('spec.md says "the %s config objects", actual %d'%(m.group(1),len(cfg_a)))
# Hand-kept, and it fails closed: a word not in the map reads as a mismatch
# rather than passing unchecked.
words={'Twenty-one':21,'Twenty-two':22,'Twenty-three':23,'Twenty-four':24,
       'Twenty-five':25,'Twenty-six':26,'Twenty-seven':27,'Twenty-eight':28,
       'Twenty-nine':29,'Thirty':30}
for _f,_txt in [('contract.md',C),('types.ts',T)]:
    for _n in re.finditer(r'(Twenty-\w+) objects',_txt):
        if words.get(_n.group(1))!=len(cfg_a):
            bad('%s says %s objects, actual %d'%(_f,_n.group(1),len(cfg_a)))

# shell/config.js is emitted from config.ts and nothing was checking it. It sat
# a version behind for a whole session, and the Stage 4 runner imports it, so
# every case ran against a config that was not the one in force. tsc strips
# types and keeps every literal, so the two literal sets have to match.
try:
    _emit=io.open('shell/config.js',encoding='utf-8').read()
except IOError:
    _emit=None; bad('shell/config.js is missing; the shell and the key run against nothing')
if _emit is not None:
    _strip=lambda t:re.sub(r'//[^\n]*','',t)
    # Module specifiers are rewritten on emit ('./types' -> './types.js'),
    # so they are the one literal kind that is allowed to differ.
    _lits=lambda t:{v for v in re.findall(r'"([^"\\]*)"',_strip(t)) if not v.startswith('.')}
    _src,_out=_lits(F),_lits(_emit)
    _gone,_extra=sorted(_src-_out),sorted(_out-_src)
    if _gone or _extra:
        bad('shell/config.js is not what config.ts emits; run `npx tsc -p tsconfig.shell.json`')
        for _v in (_gone+_extra)[:4]:
            bad('  differs on %r'%_v)

# The rules block states how many rules it holds. A count in prose that nothing
# reads is the defect this file exists to catch, and this one sat at seven while
# the block grew to nineteen.
_rb=section('## Rules the answer key forced',r'\n# 5\.',C)
if not _rb: bad('contract.md has no rules block; its count cannot be checked')
else:
    _n=re.search(r'^(\d+) rules that the contract implied',_rb.strip(),re.M)
    _real=len(re.findall(r'^\*\*',_rb,re.M))
    if not _n: bad('the rules block does not state how many rules it holds')
    elif int(_n.group(1))!=_real:
        bad('contract.md says %s rules, the block holds %d'%(_n.group(1),_real))

# A version number written into a companion file goes stale in silence. VERSIONS
# in spec.md is the only place one belongs.
# Any version of any versioned thing, written into any companion file. The
# earlier check knew two spellings, `spec/example.md v<n>` and the words
# `Companion to`, and the key's own header carried a config version for three
# sessions in a third spelling that neither saw.
_COMPANIONS=[('config.ts',F),('contract.md',C),('types.ts',T),('example.md',E),('answer_key.md',K)]
for _f,_txt in _COMPANIONS:
    _body=_txt
    if _f=='config.ts':
        # config.ts states its own version once, in the field. That one is the record.
        _body=re.sub(r'version:\s*"[^"]*"','',_body)
    _pats=[(r'spec/example\.md\s+v\d+','an example version'),
           (r'\b(?:contract|example|answer[_ ]key|key)\s+version\s+\d+','a companion version')]
    # A config version in prose is a claim about what the file was written
    # against, and that is what goes stale. The same string inside a table cell is
    # an illustrative value in an Example column, and inside the format line it is
    # the format. `spec/example.md` is licensed to carry an older stamp until the
    # deviation expires at Stage 7, so it is exempt here and only here.
    _cfg = _f in ('answer_key.md','config.ts','types.ts','contract.md')
    for _ln in _body.split('\n'):
        if '<letter>' in _ln: continue
        for _pat,_what in _pats:
            for _m in re.finditer(_pat,_ln):
                bad('%s names %s (%s); VERSIONS in spec.md is the only place'%(_f,_what,_m.group(0).strip()))
        if not _cfg or _ln.lstrip().startswith('|'): continue
        for _m in re.finditer(r'\b(?:at|against|under|written for|ships)\s+`?a\.\d+`?',_ln):
            bad('%s names a config version (%s); VERSIONS in spec.md is the only place'%(_f,_m.group(0).strip()))
# ---------- 4b. the machine contract compiles ----------
#
# `types.ts` and `config.ts` are the machine half of the contract, and nothing
# was ever running the compiler over them. `AlarmType` was declared twice from
# session 93, `tsc --strict` failed with two errors for five sessions, and
# spec.md said it compiled clean the whole time, because the claim lived in prose
# and nothing could reach it.
#
# A missing compiler FAILS rather than skips. A check that quietly says nothing
# when its tool is absent reads as a tooling problem and hides an untested gate,
# which has happened here four times.
# ---------------------------------------------------------------- finding a tool
#
# WINDOWS RUNS THIS FILE TOO (session 138). `npm` installs `tsc` and `eslint` as
# `tsc.cmd` and `eslint.cmd`, and Windows cannot start a `.cmd` through
# CreateProcess, which is what `subprocess.run([...])` calls. So a machine with
# TypeScript correctly installed reported "tsc is not installed" and failed the
# gate, and the report named the wrong thing: the repository was fine and the
# call was wrong.
#
# `shutil.which` already knows about PATHEXT, so it finds the `.cmd`. What it
# cannot do is make it startable. A `.cmd` or `.bat` is handed to the shell; a
# real executable is started directly, as before.
def _tool(*names):
    """The first of these that exists on PATH, as an argv prefix, or None."""
    for n in names:
        p=shutil.which(n)
        if p: return p
    return None

def _run(exe, args, timeout=None):
    """Start `exe` with `args`. A Windows .cmd/.bat goes through the shell."""
    if exe.lower().endswith(('.cmd','.bat')):
        line=' '.join('"%s"'%a if ' ' in a else a for a in [exe]+args)
        return subprocess.run(line,shell=True,capture_output=True,text=True,timeout=timeout)
    return subprocess.run([exe]+args,capture_output=True,text=True,timeout=timeout)

import subprocess
# `tsc` on PATH first, because it is the direct answer and needs no network. A
# local install next. `npx` last: it is the one that fetches, and a fetch inside
# a gate is a gate that fails when the wifi does.
_TSC=_tool('tsc','tsc.cmd') \
     or _tool(os.path.join('node_modules','.bin','tsc'),
              os.path.join('node_modules','.bin','tsc.cmd')) \
     or _tool('npx','npx.cmd')
if not _TSC:
    bad('tsc is not installed, so the machine contract is unchecked. Install it: `npm i -g typescript`')
    bad('  (this is a missing tool on this machine, not a defect in the repository)')
else:
    _args=['tsc'] if os.path.basename(_TSC).lower().startswith('npx') else []
    try:
        _tsc=_run(_TSC,_args+['--noEmit','--strict','types.ts','config.ts'],timeout=180)
        if _tsc.returncode!=0:
            bad('the contract does not compile under tsc --strict')
            for _l in (_tsc.stdout+_tsc.stderr).strip().split('\n')[:6]:
                if _l.strip(): bad('  %s'%_l.strip())
    except subprocess.TimeoutExpired:
        bad('tsc did not finish; the machine contract is unchecked this run')

# ---------- 4c. the example's config stamp ----------
#
# The 4 August deviation licensed `spec/example.md` to stamp an older config
# than the live one, and it expired on 14 August on its own terms: the first
# record had been written to storage, so the stamp is evidence again. The expiry
# was written into spec.md and never into this file, and the stamp sat at a.13
# through two bumps with nothing looking at it. A price nothing can charge is
# not a price.
#
# The stamp lives in a table cell, and the check above skips table cells because
# a config version in an Example column is usually illustrative. This one is not
# illustrative: it is the stamp, so it is read by name.
_m=re.search(r'^\|\s*`config_version`\s*\|\s*`([^`]+)`\s*\|',E,re.M)
if not _m:
    bad('example.md states no config_version stamp; the expiry of the 4 Aug deviation is unenforceable')
elif _m.group(1)!=gv:
    bad('example.md stamps config %s, config.ts is %s; the deviation licensing an older stamp expired 14 Aug'%(_m.group(1),gv))

# A version can hide in a name as easily as in a sentence. `configA1` outlived
# a.1 by two versions and was imported by the Stage 4 runner the whole time. The
# first two versions of this check matched the word `config` and nothing else,
# so `schemaV2` and `keyA1` walked through it untouched.
#
# The nouns are read from VERSIONS rather than listed here: a row whose value is
# a version number names a thing that carries versions. The gate rows fail that
# test, which is why `gate4` stays a legal identifier.
#
# Code only, and only outside strings and comments. A past name written in prose
# is the record, not a defect: the decision log has to be able to say what the
# thing used to be called, and selftest.py has to hold the broken spelling to
# plant it. Strings go first so a # or // inside one cannot end a line early.
def _code_only(t):
    t=re.sub(r'"(?:[^"\\\n]|\\.)*"',' ',t)
    t=re.sub(r"'(?:[^'\\\n]|\\.)*'",' ',t)
    t=re.sub(r'`(?:[^`\\]|\\.)*`',' ',t)
    t=re.sub(r'/\*.*?\*/',' ',t,flags=re.S)
    t=re.sub(r'//[^\n]*',' ',t)
    t=re.sub(r'#[^\n]*',' ',t)
    return t

_VER_VALUE=re.compile(r'^(?:[a-z]\.)?\d+$')
_nouns=set()
if vb:
    for _n,_v in re.findall(r'^\s*(\S+)\s+(\S+)\s*$',vb.group(1),re.M):
        if _VER_VALUE.match(_v):
            _nouns.update(w for w in _n.lower().split('_') if w)
if not _nouns: bad('VERSIONS states no versioned thing; the identifier check has nothing to read')
# Hand-kept. Other names the same versioned things go by in code. This list is
# the hole the check keeps: a versioned thing called something not written here
# is invisible to it, and only a reading finds that.
_nouns.update({'schema','key','types','cfg'})

# An identifier is read as its parts, split on underscores and on case changes,
# so `key` is a part of `keyA1` and not of `monkey2`. A part is a version if it
# is digits with at most one letter in front: `7`, `A1`, `V2`.
_VER_PART=re.compile(r'^[A-Za-z]?\d+$')
def _parts(ident):
    out=[]
    for chunk in ident.split('_'):
        if not chunk: continue
        chunk=re.sub(r'(?<=[a-z0-9])(?=[A-Z])',' ',chunk)
        chunk=re.sub(r'(?<=[A-Z])(?=[A-Z][a-z])',' ',chunk)
        out+=chunk.split()
    return out

_srcs=sorted(glob.glob('*.ts')+glob.glob('*.js')+glob.glob('*.mjs')+glob.glob('*.py')
             +glob.glob('shell/*.js')+glob.glob('shell/*.mjs'))
for _f in _srcs:
    _t=_code_only(io.open(_f,encoding='utf-8').read())
    for _id in sorted(set(re.findall(r'\b[A-Za-z_][A-Za-z0-9_]*\b',_t))):
        _ps=_parts(_id)
        for _i,_p in enumerate(_ps):
            if re.sub(r'\d+$','',_p).lower() not in _nouns: continue
            if (re.search(r'\d',_p)
                or (_i+1<len(_ps) and _VER_PART.match(_ps[_i+1]))
                or (_i and _VER_PART.match(_ps[_i-1]))):
                bad('%s names a version inside an identifier (%s); names outlive the version they carry'%(_f,_id))
                break

# ---------------------------------------------------------------- the schema
#
# `schema.sql` holds one column per `Task` field and nothing was comparing the
# two. A `compare_key` column sat there NOT NULL for four sessions; it is a
# working value, so nothing was ever going to write it, and every insert failed
# the first time a real row was sent. The gate reads both and names any column
# the contract does not have and any field the table does not.
#
# `_offset` companions are not fields: every instant is stored twice on purpose.
try:
    _sch=io.open('schema.sql',encoding='utf-8').read()
except OSError:
    _sch=None; bad('schema.sql is missing; the storage layer is unchecked')
if _sch is not None:
    _m=re.search(r'create table if not exists cascade_task \((.*?)\n\);',_sch,re.S)
    if not _m:
        bad('schema.sql states no cascade_task table')
    else:
        _cols=[]
        for _l in _m.group(1).split('\n'):
            _l=_l.strip()
            if not _l or _l.startswith('--') or _l.startswith('constraint'): continue
            _c=re.match(r'^([a-z_][a-z0-9_]*)\s+\S',_l)
            if _c: _cols.append(_c.group(1))
        _base=set(c for c in _cols if not c.endswith('_offset') and c!='owner')
        _fields=set(task_c)
        for _x in sorted(_base-_fields):
            bad('schema.sql: cascade_task.%s is not a Task field; a column nothing writes is a NOT NULL waiting to fire'%_x)
        for _x in sorted(_fields-_base):
            bad('schema.sql: Task.%s has no column; the record cannot be stored whole'%_x)

# ------------------------------------------------------- the harness stays gone
# THE STAGE 3 HARNESS IS DELETED (session 137). It drew an ASCII panel that no
# person opened, and `check_render.mjs` proved the panel matched a picture in
# `example.md` — a green check about a screen that did not exist. A file
# reappearing here means the two-apps-in-one-repo problem has come back.
for _dead in ('shell/app.js','shell/render.js','shell/resolve.stage3.js',
              'shell/check_render.mjs','shell/boot.js','shell/index.html'):
    try:
        io.open(_dead,encoding='utf-8').read()
        bad('%s is back; the Stage 3 harness was deleted in session 137'%_dead)
    except IOError:
        pass

# ---------------------------------------------------------------- versioned imports
# EVERY RELATIVE IMPORT IN `shell/` CARRIES THE VERSION (session 129). The whole
# cache-busting scheme is one query string: `index.html` asks for `mvp.js?v=N`
# and every module passes its own `?v=` down the graph. A plain
# `import x from "./y.js"` opts that one edge out — the browser answers it from
# whatever it already had, so a page on build 44 can be running a module from
# build 40, and if the old copy is missing an export the import fails to link
# and every module above it dies with it.
#
# Session 126 wrote exactly that line in `alarm.js` and it went unnoticed for
# three builds, which is what this rule is for.
# NO EXCUSES LEFT (session 135). `resolve.js` and `resolve.stage3.js` were
# excused because the node checks import them with no version to pass — an
# excuse worth nothing, since a relative specifier does not inherit its
# importer's query either way. The engine's imports carry the version now; in
# node the query is empty and nothing changes there.
#
# JSDoc is not an import: `@param {import("./types.js").CaptureInput}` is a type
# annotation inside a comment, and matching it was this rule's own false
# positive. Comments are stripped before the scan.
def _strip_comments(src):
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c == '/' and i + 1 < n and src[i+1] == '/':
            j = src.find('\n', i)
            i = n if j < 0 else j
        elif c == '/' and i + 1 < n and src[i+1] == '*':
            j = src.find('*/', i + 2)
            i = n if j < 0 else j + 2
        elif c in '"\'`':
            q, i = c, i + 1
            out.append(q)
            while i < n and src[i] != q:
                if src[i] == '\\': out.append(src[i]); i += 1
                if i < n: out.append(src[i]); i += 1
            out.append(q); i += 1
        else:
            out.append(c); i += 1
    return ''.join(out)

import glob as _glob
for _f in sorted(_glob.glob('shell/*.js')):
    _src = _strip_comments(open(_f, encoding='utf-8').read())
    for _m in re.finditer(r'^\s*import\s[^;\n]*?from\s+["\'](\.\/[^"\']+?)["\']', _src, re.M):
        if '?' not in _m.group(1):
            bad('%s: `%s` is imported without ?v= — the browser will answer it from cache' % (_f, _m.group(1)))
    for _m in re.finditer(r'import\(\s*["\'](\.\/[^"\']+?)["\']\s*\)', _src):
        bad('%s: `%s` is imported without ?v= — the browser will answer it from cache' % (_f, _m.group(1)))

# ------------------------------------------------------------------ no-undef
# THE CHECK THAT WOULD HAVE CAUGHT SESSION 132 (session 133). `say()` was
# deleted by accident and `say` is handed out in `mountList`'s returned API, so
# the screen threw the moment it mounted and every tab looked empty on a store
# that was intact. `node --check` parses and never resolves a name; `tsc
# --strict` here reads `types.ts` rather than the shell; and no check can import
# a screen, because every screen imports the real store at module load.
#
# It is a WARNING when eslint is not installed rather than a failure, because a
# missing tool is not a broken repository — but it says so loudly, because a
# check that quietly does not run is worse than one that was never written.
_lint = _tool('eslint','eslint.cmd')
if _lint:
    _r = _run(_lint, ['--no-config-lookup', '-c', 'eslint.config.mjs', 'shell', '.'])
    if _r.returncode not in (0,):
        for _line in (_r.stdout or _r.stderr).strip().splitlines():
            if 'no-undef' in _line or 'error' in _line.lower():
                bad('eslint: %s' % _line.strip())
else:
    warns.append('eslint is not installed, so no-undef did not run. `npm i -g eslint`. '
                 'This is the check that catches a name that does not exist.')

print('inputs %d | working %d | shown %d | Task %d | config %d | excused %d'
      %(len(inputs),len(working),len(shown),len(task_c),len(cfg_a),len(excused)))
for x in warns: print('   warning:',x)
print('GATE 2: FAIL' if fails else 'GATE 2: PASS')
for x in fails: print('  ',x)
sys.exit(1 if fails else 0)
