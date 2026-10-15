# DEC-138 – Tentativi senza rete al massimo ogni 30 secondi

**Data:** 2026-10-15 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-80 vuole la sincronizzazione anche «quando la rete torna» e, senza rete, tentativi che si diradano da 5 s fino a 5 minuti. Il client non si accorge del ritorno della rete: riprova solo a tempo. Nelle prove sul Mac del 15/10/2026, sul codice della 1.0 (TC-87, DEC-128, DEC-136), le modifiche fatte senza rete sono arrivate sull'altro dispositivo 301 s dopo il ritorno della rete, mentre CA-10.2 le vuole «appena il server torna raggiungibile».

## Opzioni valutate
A) Tentativi che si diradano da 5 s fino a 30 s al massimo, invece che 5 minuti: la rete che torna si nota entro mezzo minuto; un dispositivo senza rete fa un tentativo ogni 30 s, che non esce dal computer; con il server fermo ogni app lo cerca ogni 30 s, poco più del ritmo normale (DEC-137). Una riga di codice, nessuna dipendenza.
B) Ascoltare l'avviso del sistema operativo quando la rete torna e sincronizzare subito: serve un componente nuovo per Windows e macOS, e non si prova con il ponte usato nelle prove.
C) Lasciare 5 minuti e scrivere nei documenti «entro 5 minuti».

## Decisione
Scelta di Manuel Cucca del 15/10/2026: **A**. Supera DEC-80 per il tetto dei tentativi (30 s invece di 5 minuti) e per «quando la rete torna», che si ottiene con i tentativi ravvicinati invece che ascoltando il sistema. Provata sul Mac sul codice della 1.0: dopo 14 minuti senza rete, le modifiche partono 26 s dopo il ritorno della rete.

## Conseguenze
- `client/src-tauri/src/sincronizzazione.rs`: `ULTIMO_RITENTATIVO` a 30 s (vale anche per il controllo, senza richieste, dell'accesso scaduto).
- `architettura/architettura.md`, sezione sulla sincronizzazione; `rilascio/runbook.md`, server irraggiungibile.
- TC-87 da riprovare sulla testa di `main` prima del rilascio (DEC-136).
