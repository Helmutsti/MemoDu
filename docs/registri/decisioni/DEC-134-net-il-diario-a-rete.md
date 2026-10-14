# DEC-134 – Net: il diario a rete

**Data:** 2026-10-14 · **Stato:** Accettata · **Idea di origine:** ID-39

## Contesto
Manuel Cucca vuole un modulo di diario «a rete»: scrivere non dà vita a un file ma a un flusso di pensiero vivo nel tempo, con collegamenti bidirezionali a fatti, argomenti, persone, eventi e oggetti (ID-39, 14/10/2026). Il modulo si progetta dopo gli account nel database (DEC-132), che sono pronti per la 1.2.0.

## Opzioni valutate
Modello di partenza:
A) Logseq o Roam Research: una pagina per giorno, scrittura a punti, una pagina per ogni cosa collegata.
B) Reflect o Mem: un flusso unico nel tempo, con data e ora, collegamenti scritti nel testo.
C) Day One: voci di diario con data, luogo e tag, senza pagine per le cose collegate.
D) Tana: come A, con un tipo e i campi per ogni cosa collegata.

## Decisione
B, scelta da Manuel Cucca il 14/10/2026, con questa forma:
- nella colonna una sezione nuova, **Net**, con l'icona di un cervello, sotto CLOUD e sopra Locale;
- sotto Net due voci fisse: **Database**, con l'icona di un database, e **Doc**;
- aprendo Database si vede l'elenco dei «documenti» di cui si è parlato: persone, oggetti, eventi, argomenti;
- aprendo Doc si vede un elenco di date che si espandono e mostrano il testo, con i collegamenti.

## Conseguenze
- ID-39 diventa Accettata, nel requisito RF-18 in `moduli/net/1-requisiti.md`, in Fase 1.
- Da decidere nei requisiti: come e dove si scrive, come nascono i collegamenti, i tipi dei «documenti», cosa mostra un «documento» aperto, sincronizzazione e cifratura, rapporto con le note di CLOUD (ID-04).
- `generale/visione.md` e il perimetro in `avanzamento.md` vanno aggiornati quando RF-18 è scritto.
