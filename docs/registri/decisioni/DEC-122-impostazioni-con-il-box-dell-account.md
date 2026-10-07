# DEC-122 – Impostazioni con il box dell'account in cima e le sezioni in riquadri

**Data:** 2026-10-07 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Dopo il primo accesso vero con la 0.1.9 Manuel Cucca trova le impostazioni (SC-06) difficili da leggere: i titoli delle sezioni sono piccoli e grigi, quasi uguali alle descrizioni; le righe non hanno confini e non si capisce dove finisce una sezione; l'account (DEC-121) è una riga come le altre in mezzo alla sezione Sincronizzazione. Vuole dare importanza all'account con un box che lo circondi e più gerarchia visiva al resto.

## Opzioni valutate
- Il box dell'account: A) in cima, con lo stato della sincronizzazione (la sezione Sincronizzazione sparisce); B) in cima, solo l'account, con la sezione Sincronizzazione più sotto; C) al posto di oggi, dopo Tema.
- Le altre sezioni: A) titolo più marcato e righe dentro un riquadro con una linea sottile tra una riga e l'altra; B) titoli grandi senza riquadri; C) schede a sinistra, una sezione alla volta.
- Le sezioni: A) Tema dentro Generale; B) Tema dentro Generale e il nome del dispositivo nel box dell'account; C) come oggi.
- Il nome del dispositivo senza accesso: A) sempre nel box; B) solo dopo l'accesso.
- Lo stato della sincronizzazione: A) un pallino colorato con il testo; B) testo grigio, colore solo sui problemi.
- L'iniziale dell'email: A) un cerchio con l'iniziale; B) solo testo.

## Decisione
Scelte di Manuel Cucca del 07/10/2026:
- In cima alla pagina, sotto il titolo Impostazioni, un **box dell'account** che contiene anche lo stato della sincronizzazione (A). La sezione Sincronizzazione sparisce: le righe Stato, Ultima sincronizzazione e Account si uniscono nel box.
- Le altre sezioni hanno un **titolo più marcato** e le loro righe stanno **dentro un riquadro**, con una linea sottile tra una riga e l'altra (A). Il box dell'account usa lo stesso riquadro, più in evidenza.
- Le sezioni diventano: box dell'account, **Generale** (scorciatoia della nota rapida, avvio all'accensione, primo piano, tema), **Ricerca**. Tema entra in Generale e il **nome del dispositivo va nel box dell'account** (B); le sezioni Tema e Dispositivo spariscono.
- Il nome del dispositivo compare nel box **solo dopo l'accesso** (B). Senza accesso il box ha solo l'invito ad accedere.
- Lo stato si legge in una riga sotto l'email con un **pallino colorato** e il testo (A): verde «Sincronizzata · oggi alle 14:32», ambra «Server non raggiungibile da…», rosso «Accedi di nuovo per sincronizzare», con Accedi al posto di Esci.
- A sinistra un **cerchio con l'iniziale** dell'email (A); senza accesso al suo posto l'icona di un utente generico.

Deduzioni dell'agente, confermate da Manuel Cucca il 07/10/2026 con l'accettazione:
- Senza accesso il box dice «Non hai fatto l'accesso» con sotto «Le note restano su questo computer.» e il pulsante Accedi, che apre SC-05 come oggi.
- La sincronizzazione in corso non ha un suo stato: resta quello dell'ultima riuscita, come oggi.
- Il nome del dispositivo cambiato senza accesso non serve: resta il nome del computer (RB-51) finché non si accede.
- In Generale l'ordine è: scorciatoia, avvio all'accensione, primo piano, tema. La posizione di «Tieni Memodu in primo piano» era da rivedere (DEC-93): resta in Generale.
- Misure, colori del riquadro e del box, dimensione del cerchio e del pallino si decidono nella libreria (Fase 5), con i token che ci sono (`successo`, `avviso`, `errore`).

Scelta di Manuel Cucca del 07/10/2026, dopo i mockup, per gli stati che i mockup non mostravano: pallino grigio (`icona-tenue`) «In attesa della prima sincronizzazione»; ambra anche «Non riuscita: riprovo da sola»; rosso anche «Memodu e il server hanno versioni diverse»; il server irraggiungibile dice l'ora dell'ultima sincronizzazione riuscita: «Server non raggiungibile: ultimo backup 14:32» (scelta di Manuel Cucca del 07/10/2026 durante il codice, al posto di «da 2 ore» del mockup; con la data davanti se non è di oggi).

## Conseguenze
- Cambia SC-06 (interfaccia, `4-schermate.md`) e la sezione Sincronizzazione di SC-06 nel modulo sincronizzazione; cambiano i criteri di RF-14 sulla riga Account (CA-14.7 e seguenti) e il testo dello stato della sincronizzazione.
- Libreria: un componente nuovo per il box dell'account e uno per il gruppo di righe in riquadro, CMP-18 dentro il riquadro, il titolo di sezione (Manuel Cucca pubblica); poi wireframe e mockup di SC-06 nei due stati, con i tre stati della sincronizzazione; poi il codice (`Impostazioni.tsx` e i suoi stili).
- Supera in parte DEC-91 (le cinque sezioni di SC-06) e DEC-121 (la riga Account nella sezione Sincronizzazione).
