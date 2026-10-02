// Limite delle note per l'interfaccia. Indirizzo e limiti del server stanno in
// `api/src/costanti.ts` (DEC-105).

/** Limite di una nota, misurato sui dati che l'interfaccia manda: 4 MB (EN-01, DEC-106). */
export const LIMITE_CORPO_BYTE = 4 * 1024 * 1024;
