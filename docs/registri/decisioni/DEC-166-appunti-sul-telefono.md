# DEC-166 – Copiare negli appunti sul telefono

**Data:** 2026-10-20 · **Stato:** Proposta · **Idea di origine:** —

## Contesto
Dopo un cambio della password fatto con la chiave di recupero, il telefono mostra la chiave nuova una sola volta (RB-99), con «Copia» come sul computer (Chiave da conservare). React Native non ha più un modulo per gli appunti.

## Opzioni valutate
A) Solo il testo selezionabile, senza «Copia».
B) `expo-clipboard`, il modulo di Expo per gli appunti (nativo, nella versione dell'SDK 58).

## Decisione
B, proposta dell'agente: «Copia» funziona come sul computer e diventa «Copiata». Il modulo è nativo: entra nell'app con la prossima compilazione.

## Conseguenze
- `telefono/package.json`; `telefono/src/app/cambia-password.tsx`.
