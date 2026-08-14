# -*- coding: utf-8 -*-
"""Test the gate before trusting it. Each case breaks one file in one way and
the gate must report it. A gate that passes on these is worse than no gate."""
import io,os,shutil,subprocess,sys,tempfile
SRC=['contract.md','types.ts','example.md','config.ts','spec.md','answer_key.md','gate2.py','gate4.mjs','log.manifest']
# gate2.py now reads the emitted config too, so the sandbox has to carry it.
# gate4.mjs runs the engine, so the sandbox carries the shell files it imports.
SRC_DIRS=['shell/config.js','shell/app.js','shell/resolve.js','shell/resolve.stage3.js','shell/types.js','shell/lemma.js','shell/render.js','shell/cards.js','shell/store.js','shell/search.js','shell/push.js','shell/repeat.js','shell/clash.js','shell/alarm.js']
def _versions_line(key):
    import re
    m=re.search(r'^\s*%s\s+\S+\s*$'%key,io.open('spec.md',encoding='utf-8').read(),re.M)
    return m.group(0)

def _live(path,pattern):
    """The current text a fixture is about to break. Pinning it meant every
    bump of the real number turned a fixture into SETUP BROKEN, which reports
    as a miss and reads as a tooling problem rather than as an untested gate."""
    import re
    m=re.search(pattern,io.open(path,encoding='utf-8').read())
    if not m: raise SystemExit('selftest: %r matched nothing in %s'%(pattern,path))
    return m.group(0)

CASES=[
 ("invented screen row", 'example.md', "APPEND",
  "\n```\n\u250c\u2500\u2500\u2500\u2500\u2510\n\u2502  Snooze until Tuesday   [Remind me later]   \u2502\n\u2514\u2500\u2500\u2500\u2500\u2518\n```\n"),
 ("wrong Task Example", 'contract.md',
  "| `raw_text` | text | yes | characters | 1 to `limits.raw_text_chars`. Never truncated. | `Call markan morning` |",
  "| `raw_text` | text | yes | characters | 1 to `limits.raw_text_chars`. Never truncated. | `YYY` |"),
 ("over-broad excuse", 'contract.md',
  "| `decided_by` | text | — | The override or factor separating this task from its neighbour: the row below, or for the last row, the row above. Never empty in a list of two or more. | `is_hard` |",
  "| `decided_by` | text | — | The override or factor separating this task from its neighbour: the row below, or for the last row, the row above. Never empty in a list of two or more. | `WWW` |"),
 # Read out of spec.md rather than written here. Pinning the number meant this
 # fixture broke on the next contract bump and reported SETUP BROKEN, which is a
 # miss dressed as a tooling problem.
 ("stale version in spec", 'spec.md', _versions_line('contract'), _versions_line('contract')[:-1]),
 # Gate 3's number, planted the other way round: the shell moves and VERSIONS
 # does not. Nothing read the shell's version until this session.
 ("stale shell version", 'shell/render.js',
  _live('shell/render.js', r'export const SHELL_VERSION = \d+;'), "export const SHELL_VERSION = 99;"),
 # A box whose rails sit one column off its own sides. Every row stays 68 wide,
 # which is why width alone never saw it and thirty-four passes read past it.
 ("misaligned box in the example", 'example.md',
  "\u2502  \u250f"+"\u2501"*48+"\u2513", "\u2502   \u250f"+"\u2501"*47+"\u2513"),
 # Planted beside the export rather than on it. Renaming `partAConfig` breaks
 # the reader that finds the config body, so the gate died on a traceback and the
 # crash was counted as a catch. This plants a versioned name the reader survives.
 ("version inside an identifier", 'config.ts',
  "export const partAConfig: Config = {",
  "const cfgA1 = 0;\nexport const partAConfig: Config = {"),
 # No `config` in either name. The check matched that one word until now, so both
 # of these were invisible to it.
 ("version in a name, noun is `schema`", 'shell/app.js',
  "const logEl = $(\"log\");", "const schemaV2 = $(\"log\");"),
 ("version in a name, noun is `key`", 'gate4.mjs',
  "const src = readFileSync(KEY, \"utf8\");",
  "const srcKeyV7 = readFileSync(KEY, \"utf8\");"),
 # Planted in the runner rather than the source: the first version of this check
 # read config.ts and types.ts only, and this is the file it could not see.
 ("version inside an identifier, one directory over", 'gate4.mjs',
  "import { partAConfig } from \"./shell/config.js\";",
  "import { configA1 } from \"./shell/config.js\";"),
 ("stale emitted config", 'shell/config.js',
  _live('shell/config.js', r'version: "a\.\d+"'), 'version: "a.99"'),
 ("example version in a companion", 'config.ts',
  "// Every value here is one that an origin in spec/example.md points at.",
  "// Every value here is one that an origin in spec/example.md v19 points at."),
 ("dead vocabulary member", 'config.ts', '"confirm", "book", "bill", "hire",', '"confirm", "book", "bill", "hire", "zzz",'),
 ("shown output missing from types", 'types.ts', "  input_field: InputFieldState;", ""),
 ("badge with a non-member verb", 'example.md',
  "\u2502   Call markan                                                    \u2502", "\u2502   Call markan                                banana \u00b7 30m       \u2502"),
 ("badge with the wrong member", 'example.md',
  "Reply to bharti singhal   due today \u00b7 reply \u00b7  5m", "Reply to bharti singhal   due today \u00b7 message \u00b7  5m"),
 ("stale count in spec", 'spec.md',
  _live('spec.md', r'the \d+ config objects'), "the 21 config objects"),
 ("stale rule count in contract", 'contract.md',
  "34 rules that the contract implied", "7 rules that the contract implied"),
 # Anchored on the heading alone. Naming an entry underneath it meant the
 # fixture broke every time one was prepended, which reads as a missed defect.
 ("version below the decision log", 'spec.md',
  "# DELIBERATE DEVIATIONS FROM PROTOCOL\n\n",
  "# DELIBERATE DEVIATIONS FROM PROTOCOL\n\nShips at contract version 99.\n\n"),
 ("ragged drawn panel", 'example.md',
  "\u2502  Default                                                         \u2502",
  "\u2502  Default                                                       \u2502"),
 ("companion version outside spec", 'contract.md',
  "Companion to `spec/example.md`; see VERSIONS in spec.md.",
  "Companion to `spec/example.md` v23."),
 ("edited decision-log entry", 'spec.md', "client-generated UUID v7", "client-generated UUID vN"),
 ("stale member list in contract", 'contract.md',
  "| `action_verbs` | member list | listed in `config.ts` only; every member reachable from `verb_lexicon` |",
  "| `action_verbs` | member list | `call` `check` `pay` `submit` `message` `make` `meet` |"),
 ("stale object count in types", 'types.ts',
  _live('types.ts', r'// [A-Z][a-z]+(-\w+)? objects\.'), "// Twenty-two objects."),
 ("return shape missing from types", 'types.ts', "  task: Task;\n", ""),
 ("stale key-case count in spec", 'spec.md', "holds 144 key cases", "holds 80 key cases"),
 # Every date in the key carries its weekday and gate4.mjs checks it against the
 # date. This fixture is the only one that runs the other gate: gate2.py cannot
 # see a wrong weekday, so the case names gate4.mjs as its checker below.
 ("weekday that contradicts its date", 'answer_key.md',
  "| B3 | \u2014 | `friday` | `call kushan` | *(empty)* | `friday` | `day` | `window` | Fri 7 Aug 09:00",
  "| B3 | \u2014 | `friday` | `call kushan` | *(empty)* | `friday` | `day` | `window` | Thu 7 Aug 09:00"),
 # The spelling that escaped for three sessions: a config version in the key's
 # own header, in neither of the two spellings the earlier check knew.
 ("config version in the key header", 'answer_key.md',
  "checked by `gate2.py` against whichever config is in force.",
  "checked by `gate2.py` at `a.2`."),
]
passed=failed=0
for name,fname,old,new in CASES:
    d=tempfile.mkdtemp()
    for f in SRC: shutil.copy(f,d)
    for f in SRC_DIRS:
        os.makedirs(os.path.join(d,os.path.dirname(f)),exist_ok=True)
        shutil.copy(f,os.path.join(d,f))
    p=os.path.join(d,fname); t=io.open(p,encoding='utf-8').read()
    if old=="APPEND":
        io.open(p,'w',encoding='utf-8').write(t+new)
    elif t.count(old)!=1:
        print("  SETUP BROKEN  %-32s (%d matches)"%(name,t.count(old))); failed+=1; shutil.rmtree(d); continue
    else:
        io.open(p,'w',encoding='utf-8').write(t.replace(old,new))
    # Most fixtures are read by gate2.py. A defect only the key runner can see,
    # like a weekday that contradicts its date, names gate4.mjs instead.
    byGate4 = 'weekday' in name
    cmd = ['node','gate4.mjs'] if byGate4 else [sys.executable,'gate2.py']
    r=subprocess.run(cmd,cwd=d,capture_output=True,text=True)
    verdict = 'gate4: the key says' if byGate4 else 'GATE 2: FAIL'
    if r.returncode!=0 and verdict not in (r.stdout+r.stderr):
        print("  CRASHED       %-32s  <-- died before reporting; a traceback is not a catch"%name); failed+=1
    elif r.returncode!=0: print("  caught        %-32s"%name); passed+=1
    else: print("  MISSED        %-32s  <-- the gate passed on a real defect"%name); failed+=1
    shutil.rmtree(d)
r=subprocess.run([sys.executable,'gate2.py'],capture_output=True,text=True)
clean = r.returncode==0
print("\n  clean files   %s"%("pass, as expected" if clean else "FAIL — the gate rejects correct files"))
print("\n%d caught, %d missed"%(passed,failed))
sys.exit(0 if failed==0 and clean else 1)
