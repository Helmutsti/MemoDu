# DEC-40 – Il cestino si apre dalla riga in fondo alla colonna

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** ID-18

## Contesto
Il menu `···` della nota aveva sia «Elimina» (manda la nota aperta nel cestino) sia «Cestino» (apre SC-04), con la stessa icona. Provando l'app, Manuel Cucca li legge come un doppione. Fino a qui SC-01 diceva che il Cestino non sta nella colonna, per tenerla dedicata alla scrittura; ID-18 proponeva invece un cestino sempre visibile in fondo alla colonna.

## Opzioni valutate
A) Rinominare la voce in «Apri il cestino», con un'altra icona.
B) Togliere «Cestino» dal menu e aprire il cestino da una riga in fondo alla colonna.
C) Togliere «Cestino» dal menu e aprirlo da un pulsante accanto al `···`.
D) Rinominare «Elimina» in «Sposta nel cestino».

## Decisione
B, scelta da Manuel Cucca. Supera quanto scritto in SC-01 («Il Cestino non è nella colonna sinistra»).

## Conseguenze
- In fondo alla colonna, fissa anche quando la colonna scorre, una riga «Cestino» (CMP-06) con l'icona del cestino e il numero di elementi; selezionata quando il cestino è aperto. Durante il trascinamento lascia il posto al cestino di trascinamento (CMP-14).
- Il menu `···` della nota: Sposta in…, Elimina (e più avanti Tag…, Date…, Impostazioni). Senza una nota aperta e senza altre voci il `···` non compare.
- `GET /albero` restituisce anche il numero di elementi nel cestino.
- Aggiornati SC-01, SC-04, CMP-06, CMP-09, CMP-14, CA-15.4, TC-46; ID-18 resta in stato Proposta finché il team non la chiude.
