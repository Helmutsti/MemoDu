# DEC-78 – Sincronizzazione prima in chiaro, cifratura rinviata

**Data:** 2026-09-30 · **Stato:** Accettata; condizione 2 superata da DEC-104 · **Idea di origine:** —

## Contesto
DEC-08 e RNF-02 chiedono che tutti i dati siano cifrati end-to-end. Scegliendo l'algoritmo per i blocchi di DEC-75, Manuel Cucca ha chiesto se per ora si può sincronizzare in chiaro. Il server gira solo sulla macchina di sviluppo (ambiente Locale, `127.0.0.1`) e tratta i blocchi come byte che non legge.

## Opzioni valutate
A) Cifrare subito, con XChaCha20-Poly1305 (RustCrypto), AES-256-GCM (ring) o libsodium.
B) Sincronizzare in chiaro per ora, con il formato pronto per la cifratura.

## Decisione
Scelta di Manuel Cucca: **B**, alle condizioni proposte dall'agente e accettate:
1. **Formato dei blocchi:** ogni blocco dichiara come è scritto («in chiaro» o l'algoritmo di cifratura). I due formati convivono durante il passaggio; accendere la cifratura non cambia il protocollo.
2. **Server solo in locale** finché la cifratura è spenta: niente hosting fuori dalla macchina (NAS, VPS, cloud).
3. **Passaggio pulito:** quando la cifratura si accende, il client rimanda tutti gli elementi cifrati e il server cancella le versioni precedenti in chiaro (DEC-77).
4. **Credenziali pronte:** le credenziali dell'installazione contengono già la chiave di cifratura (DEC-13), anche se per ora non si usa; l'autorizzazione del dispositivo serve comunque (RF-14).

## Conseguenze
- DEC-08 e RNF-02 restano validi: la cifratura è rinviata, non tolta. Algoritmo e libreria si scelgono quando si accende.
- Rischio accettato: finché è spenta, chi legge i file del server legge le note; oggi coincide con chi ha accesso al computer, come per la copia di lavoro.
- Hosting definitivo del server: possibile solo dopo aver acceso la cifratura.
- `architettura/architettura.md` e i rinvii in `avanzamento.md`.
