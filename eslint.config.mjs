// Cascade Part A — the one thing `node --check` cannot see.
//
// WHY THIS FILE EXISTS (session 133). Session 132 removed undo and deleted
// `say()` along with it by accident. `say` is handed out in `mvp.list.js`'s
// returned API, so the object literal at the bottom of `mountList` threw a
// ReferenceError THE MOMENT THE SCREEN MOUNTED. The list never rendered and
// every tab looked empty on a store that was completely intact — he reported it
// as "all my tasks from all tabs vanished", which is exactly what it looks like
// from the outside.
//
// Eight checks were green. They could not have been anything else: `node
// --check` parses a file and never resolves a name, `tsc --strict` in gate2
// reads `types.ts` rather than the shell, and no check can import a screen at
// all because every screen imports the real store at module load — the same
// seam problem session 127 solved for the write paths and has not yet solved
// for the screens.
//
// `no-undef` is the whole point and the only rule enabled. Style is not a
// concern here and a linter that argues about style is one that gets turned
// off. Everything a browser hands the app is declared below, so anything left
// is a name that does not exist.
//
// gate2 runs this when eslint is installed and says loudly when it is not.
// Install: npm i -g eslint

export default [
  {
    files: ["shell/**/*.js", "shell/**/*.mjs", "*.mjs"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        // The browser, as this app actually uses it.
        window: "readonly", document: "readonly", navigator: "readonly",
        location: "readonly", history: "readonly", localStorage: "readonly",
        fetch: "readonly", crypto: "readonly", matchMedia: "readonly",
        getComputedStyle: "readonly", requestAnimationFrame: "readonly",
        setTimeout: "readonly", clearTimeout: "readonly",
        setInterval: "readonly", clearInterval: "readonly",
        CustomEvent: "readonly", Event: "readonly", Blob: "readonly",
        URL: "readonly", URLSearchParams: "readonly",
        atob: "readonly", btoa: "readonly", alert: "readonly", console: "readonly",
        // Node, for the checks that run there.
        process: "readonly",
      },
    },
    rules: { "no-undef": "error" },
  },
];
