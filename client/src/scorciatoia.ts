// La scorciatoia della nota rapida nelle impostazioni (DEC-91): dal tasto premuto al formato del
// nucleo («Control+Alt+KeyN»), e da quello al testo mostrato («Ctrl + Alt + N»).

export type Sistema = "windows" | "macos";

/** I modificatori nell'ordine del nucleo, con i nomi dei tasti su Windows e su macOS. */
const MODIFICATORI = [
  {
    nucleo: "Control",
    windows: "Ctrl",
    macos: "Control",
    premuto: (e: KeyboardEvent) => e.ctrlKey,
  },
  { nucleo: "Alt", windows: "Alt", macos: "Option", premuto: (e: KeyboardEvent) => e.altKey },
  {
    nucleo: "Shift",
    windows: "Maiusc",
    macos: "Maiusc",
    premuto: (e: KeyboardEvent) => e.shiftKey,
  },
  { nucleo: "Super", windows: "Win", macos: "Command", premuto: (e: KeyboardEvent) => e.metaKey },
] as const;

/** Tasti che si possono usare con i modificatori: lettere, cifre, tasti funzione e Spazio. */
const TASTO = /^(Key[A-Z]|Digit[0-9]|F[0-9]{1,2}|Space)$/;
const SOLO_MODIFICATORI = /^(Control|Alt|Shift|Meta|OS)(Left|Right)?$/;

/**
 * La combinazione del tasto premuto: null se si stanno ancora premendo i modificatori,
 * "non valida" se il tasto non si può usare o i modificatori sono meno di due.
 */
export function daTasto(e: KeyboardEvent): string | "non valida" | null {
  if (SOLO_MODIFICATORI.test(e.code) || SOLO_MODIFICATORI.test(e.key)) return null;
  const modificatori = MODIFICATORI.filter((m) => m.premuto(e)).map((m) => m.nucleo);
  if (!TASTO.test(e.code) || modificatori.length < 2) return "non valida";
  return [...modificatori, e.code].join("+");
}

/** «Control+Alt+KeyN» → «Ctrl + Alt + N» su Windows, «Control + Option + N» su macOS. */
export function scriviScorciatoia(combinazione: string, sistema: Sistema): string {
  return combinazione
    .split("+")
    .map((parte) => {
      const modificatore = MODIFICATORI.find((m) => m.nucleo === parte);
      if (modificatore) return modificatore[sistema];
      if (parte === "Space") return "Spazio";
      return parte.replace(/^Key|^Digit/, "");
    })
    .join(" + ");
}
