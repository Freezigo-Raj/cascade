// Cascade Part A — the two lines every screen writes.
//
// Making an element and making a button were written out in four files the
// week there were four files, which is the same argument as the clock: two
// copies of a thing that has to agree are one edit away from disagreeing.
// Nothing here decides anything; it is the shape the screens are built from.

/** An element, with an optional class and optional text. */
export const el = (kind, cls, text) => {
  const n = document.createElement(kind);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

/** A button that is a button: `type` set, so one inside a form cannot submit it. */
export const button = (cls, label, fn) => {
  const b = el("button", cls, label);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
};
