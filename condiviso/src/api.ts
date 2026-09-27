// Dove l'app trova l'API nell'ambiente Locale (architettura/ambienti.md).

/** L'API ascolta solo sulla macchina stessa (architettura/api.md). */
export const HOST_API = "127.0.0.1";
export const PORTA_API = 4317;
export const INDIRIZZO_API = `http://${HOST_API}:${PORTA_API}`;

/** Limite del corpo delle richieste: 10 MB (EN-01). */
export const LIMITE_CORPO_BYTE = 10 * 1024 * 1024;
