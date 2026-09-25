# DEC-17 – Eliminazione definitiva di un singolo elemento del cestino

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Dal cestino (SC-04) si poteva solo ripristinare un elemento o svuotare tutto il cestino (RB-27, RB-32). Per togliere per sempre una sola nota o cartella bisognava svuotare anche tutto il resto. Emerso rivedendo CMP-17.

## Opzioni valutate
A) Solo Svuota cestino, com'era.
B) Anche "Elimina definitivamente" su ogni elemento, con conferma.

## Decisione
Opzione B, scelta da Manuel Cucca. Ogni elemento del cestino ha, accanto a Ripristina, un pulsante con l'icona del cestino ("Elimina definitivamente") che chiede conferma prima di eliminare quell'elemento per sempre (RB-55). Resta vero che Memodu non cancella mai dati da solo: solo l'utente, e sempre dopo una conferma.

## Conseguenze
- FL-05: nuovo percorso e nuova regola RB-55; RB-27 aggiornata.
- SC-04: ogni elemento ha Ripristina ed Elimina definitivamente.
- CMP-17: pulsante solo icona con il cestino; CMP-16: conferma per il singolo elemento.
- RF-15: allineato il punto sulla permanenza nel cestino (svuotarlo o eliminare un elemento, sempre con conferma); nessun requisito nuovo. Le entità non cambiano.
- Da verificare in FL-07: eliminazione definitiva su un dispositivo mentre un altro modifica lo stesso elemento (come per lo svuotamento).
