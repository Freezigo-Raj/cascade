// Cascade Part A — the shell's own version number, and nothing else.
//
// It lived in `render.js` while `render.js` existed, because the Stage 3 ASCII
// panel was what a hand checked at Gate 3. That panel, its file and its check
// are deleted: the app a person opens is `mvp.js`, and a drawing of a screen
// nobody opens is documentation pretending to be evidence.
//
// The number now lives alone, because everything that reads it reads only it:
//   - `index.html` pins `mvp.js?v=` and the stylesheet link to it
//   - all five `@import` queries in `mvp.edit.css` carry it
//   - `--css-version` in `mvp.css` states it, so the app can tell a stale
//     stylesheet from a fresh one
//   - `mvp.account.js` and the header draw it, so a phone can say what it runs
//   - `gate2.py` reads it and holds every one of those numbers to it
//
// Bump it when anything under `shell/` changes, and bump the six numbers above
// with it or gate2 fails.
export const SHELL_VERSION = 55;
