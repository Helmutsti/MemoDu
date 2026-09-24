# DEC-10 – Figma come strumento di design

**Data:** 2026-09-24 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-09 ha stabilito che i disegni delle Fasi 4, 5 e 6 vivono in uno strumento di design, con link ed esportazioni nel repository (sezione "Disegni" della guida), ma non ha scelto quale. La scelta era annotata in `avanzamento.md` come la prima cosa da decidere alla ripresa della Fase 4.

Lo strumento deve reggere tutte e tre le fasi, non solo i wireframe: la Fase 5 chiede componenti e token, la Fase 6 i mockup.

## Opzioni valutate
A) Figma.
B) Penpot: open source e installabile sul proprio server, coerente con l'installazione personale di Memodu (DEC-05), ma senza collegamento diretto dagli strumenti di lavoro.
C) Excalidraw: adatto ai wireframe a bassa fedeltà, inadatto alle Fasi 5 e 6; costringerebbe a cambiare strumento a metà.
D) Wireframe scritti in HTML nel repository: niente strumento esterno, disegni versionati in git e wireflow cliccabile senza prototipo, ma fuori dalla sezione "Disegni" della guida e valido solo per la Fase 4.

## Decisione
Opzione A: Figma, per le Fasi 4, 5 e 6.

Pesa più di tutto il fatto che Figma sia raggiungibile direttamente dagli strumenti di lavoro: i frame si possono creare e aggiornare senza passaggi manuali, e questo vale per tutte e tre le fasi. Le variabili di Figma reggono i token della Fase 5 (`design-system/tokens.md`).

Restano valide senza modifiche le regole della sezione "Disegni" della guida: il disegno vive nello strumento, nessuna decisione vive solo lì.

## Conseguenze
- La sezione "Disegni" della guida (DEC-09) si applica così com'è: nessuna regola del metodo cambia.
- Ogni frame riporta il codice `SC-` o `CMP-` che rappresenta.
- `moduli/*/4-schermate.md` contiene il link al frame di ogni schermata, più stati, testi e componenti usati.
- A ogni revisione un'esportazione per schermata va in `moduli/*/immagini/`, con il nome del codice (`SC-01.png`).
- `avanzamento.md`: la voce "Strumenti" indica Figma e il file di lavoro.
- Vincolo verificato il 24/09/2026 sull'account `manuc.1297@gmail.com`: il piano "MEP" non esiste più con quel nome. Il posto con permessi di scrittura è il **Dev** sul piano "Il mio team solitario" (livello *pro*); l'altro piano, "kansei Noir - Site", dà un posto View. Il file di lavoro va creato in "Il mio team solitario".
