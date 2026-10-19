// Token del design system sul telefono (DEC-157): colori uguali al computer
// (client/src/stili/token.css, modi Chiaro e Scuro), e ogni misura del computer moltiplicata per
// 17/13 e arrotondata, così ogni componente è il suo frame di Figma ingrandito. Le righe
// toccabili restano almeno a 44. Carattere Inter, come sul computer (base.css).

import { useColorScheme, type TextStyle } from "react-native";

/** Una misura del design system (computer) alla scala del telefono. */
export const t = (misura: number) => Math.round((misura * 17) / 13);

const grigio = {
  0: "#FFFFFF",
  50: "#F4F4F4",
  100: "#EBEBEB",
  200: "#E0E0E0",
  300: "#C1C1C1",
  400: "#A3A3A3",
  500: "#696969",
  600: "#525252",
  700: "#3D3D3D",
  750: "#383838",
  800: "#2B2B2B",
  900: "#1F1F1F",
  950: "#141414",
};

const chiaro = {
  sfondoNota: grigio[0],
  sfondoColonna: grigio[50],
  sfondoCampo: grigio[100],
  sfondoHover: grigio[200],
  sfondoPieno: grigio[900],
  sfondoPremuto: grigio[300],
  sfondoFlottante: grigio[0],
  testoPrimario: grigio[900],
  testoTenue: grigio[500],
  testoSuPieno: grigio[0],
  iconaTenue: grigio[500],
  iconaSuPieno: grigio[0],
  bordoDivisoreTenue: "rgba(0,0,0,0.06)",
  ombraFlottante: "rgba(0,0,0,0.12)",
  /** ombra-flottante come opacità del nero, per le ombre native. */
  ombraOpacita: 0.12,
};

const scuro: typeof chiaro = {
  sfondoNota: grigio[950],
  sfondoColonna: grigio[900],
  sfondoCampo: grigio[750],
  sfondoHover: grigio[700],
  sfondoPieno: grigio[50],
  sfondoPremuto: grigio[600],
  sfondoFlottante: grigio[800],
  testoPrimario: grigio[50],
  testoTenue: grigio[400],
  testoSuPieno: grigio[950],
  iconaTenue: grigio[400],
  iconaSuPieno: grigio[950],
  bordoDivisoreTenue: "rgba(255,255,255,0.05)",
  ombraFlottante: "rgba(0,0,0,0.40)",
  ombraOpacita: 0.4,
};

export type Colori = typeof chiaro;

export function useColori(): Colori {
  return useColorScheme() === "dark" ? scuro : chiaro;
}

/** Spazi di ruolo (tokens.md, regola 12) alla scala del telefono. */
export const spazio = {
  elemento: t(4),
  iconaPiccola: t(4),
  icona: t(8),
  controlloPiccolo: t(8),
  controllo: t(12),
  pulsante: t(16),
  blocco: t(16),
  gruppo: t(24),
  elenco: t(8),
  pannello: t(16),
  finestra: t(24),
  rientro: t(24),
};

export const raggio = { pillola: 999, contenitore: t(20), interno: t(12), casella: t(4) };

export const misura = {
  /** misura-riga 32 → 42, portata a 44 perché si tocca. */
  riga: Math.max(44, t(32)),
  controlloPiccolo: t(24),
  /** misura-icona 16 → 21: le icone della libreria esistono a 20, la misura più vicina. */
  icona: 20,
  tratto: 1.5,
};

/** Stili di testo del design system (Interfaccia/…, Nota/…) alla scala del telefono. */
const stile = (famiglia: string, misuraPc: number, interlinea: number): TextStyle => ({
  fontFamily: famiglia,
  fontSize: t(misuraPc),
  lineHeight: Math.round(t(misuraPc) * interlinea),
});

export const testo = {
  controllo: stile("Inter_400Regular", 13, 1.4),
  controlloAttivo: stile("Inter_500Medium", 13, 1.4),
  titolo: stile("Inter_500Medium", 13, 1.4),
  messaggio: stile("Inter_400Regular", 13, 1.4),
  etichetta: stile("Inter_500Medium", 11, 1.3),
  dettaglio: stile("Inter_400Regular", 11, 1.3),
  titoloSchermata: stile("Inter_600SemiBold", 19, 1.35),
  notaTitolo: stile("Inter_700Bold", 30, 1.2),
  notaSottotitolo: stile("Inter_600SemiBold", 19, 1.35),
  notaCorpo: stile("Inter_400Regular", 15, 1.6),
};
