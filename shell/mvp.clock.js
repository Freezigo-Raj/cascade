// Cascade Part A — the one clock the screens read.
//
// Every instant in this project is ISO local-with-offset, to the second, and
// both screens stamp records with it. It was written twice the moment there
// were two screens, which is how two functions that have to agree begin to
// disagree. One function, imported by both.

/** ISO local-with-offset, to the second. */
export function nowLocal() {
  const d = new Date();
  const p = (n) => String(Math.abs(n)).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` +
    `${off < 0 ? "-" : "+"}${p(Math.trunc(off / 60))}:${p(off % 60)}`
  );
}
