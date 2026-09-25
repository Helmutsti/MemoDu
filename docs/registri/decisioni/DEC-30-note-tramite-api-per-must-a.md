# DEC-30 – Note tramite l'API per il frammento Must A

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Per Must A (RF-01, RF-02) restava da decidere chi gestisce le note: l'interfaccia, il nucleo Rust dell'app (DEC-23) o l'API Node (DEC-24), che per ora gira sulla macchina di sviluppo con l'archivio su file (DEC-25, ambiente Locale).

## Opzioni valutate
A) L'interfaccia, con i permessi sui file di Tauri.
B) Il nucleo Rust, dietro pochi comandi.
C) L'API Node: l'app chiede di aprire, salvare ed elencare le note; l'API scrive i file.
D) Come C, ma per sempre: nessuna copia sul dispositivo (avrebbe superato DEC-02 e cambiato RNF-01).

## Decisione
Opzione C, scelta da Manuel Cucca, **solo per ora**: l'app non salva niente da sé, le note passano dall'API. È la stessa strada che userà la sincronizzazione, e con l'API sulla stessa macchina i tempi di RNF-01 restano raggiungibili.

## Conseguenze
- DEC-02 e RNF-01 restano validi: la copia di lavoro sul dispositivo arriva con la sincronizzazione (frammento Must).
- Formato e organizzazione dei file (DEC-28, DEC-29) valgono per l'archivio dell'API; l'API è l'unica che scrive le note.
- Il nucleo Rust fa solo area di notifica, scorciatoia globale e finestre.
- Must A non è più "senza server": gli servono il framework HTTP dell'API e gli endpoint delle note (aprire, salvare, creare, elencare) in `architettura/api.md`, con i loro errori. Il protocollo di sincronizzazione resta al frammento Must.
