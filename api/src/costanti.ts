// Indirizzo in locale e limiti del server. Stanno qui, non in `condiviso`: su Vercel il server
// gira come JavaScript compilato e non può importare i sorgenti TypeScript di un altro pacchetto
// (DEC-105). Il limite della nota, che serve al client, resta in `condiviso`; una prova controlla
// che una nota al limite stia in una richiesta.

/** In locale l'API ascolta solo sulla macchina stessa (architettura/api.md). */
export const HOST_API = "127.0.0.1";
export const PORTA_API = 4317;
export const INDIRIZZO_API = `http://${HOST_API}:${PORTA_API}`;

/**
 * Limite di una richiesta al server: Vercel non accetta più di 4,5 MB per richiesta e per
 * risposta (DEC-105, DEC-106). Una nota di 4 MB ci sta con il resto del blocco.
 */
export const LIMITE_RICHIESTA_BYTE = 4_400_000;

/** Una pagina delle modifiche si ferma prima di questa somma di blocchi (DEC-106). */
export const LIMITE_PAGINA_BYTE = 4_000_000;
