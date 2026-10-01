# DEC-99 – Icona della cartella nella colonna

**Data:** 2026-10-01 · **Stato:** Accettata · **Idea di origine:** ID-34

## Contesto
Nella colonna le cartelle si riconoscevano dalle note solo per la freccia ▸/▾ e per il numero di note (CMP-06); in CMP-06 c'era scritto «Niente icona di cartella: la direzione C tiene la colonna pulita (DEC-12)». Manuel Cucca ha chiesto un'icona della cartella al posto della freccia, per dividere di più note e cartelle. Proposte nella pagina [Proposta · Icona della cartella](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=180-2948) del file dei mockup.

## Opzioni valutate
A) La cartella chiusa o aperta al posto della freccia; le note restano senza icona.
B) La freccia e, dopo, la cartella, come in Esplora risorse: il nome della cartella si sposta di 20 e non è più allineato con le note dello stesso livello.
C) Come A, e ogni nota con l'icona della nota: la divisione più netta, ma la colonna si riempie di icone.

## Decisione
A, scelta di Manuel Cucca, 01/10/2026. Nella colonna la cartella chiusa ha l'icona `folder` e quella aperta `folder-open` (Lucide, 16, `icona-tenue`), al posto della freccia e nello stesso posto: rientri e allineamenti non cambiano. Un clic sulla riga apre e chiude come prima. Le note restano senza icona; i titoli di sezione («Non organizzate», «Cartelle») tengono la freccia.

## Conseguenze
- Design system: nuova icona **cartella aperta** (`folder-open`, CMP-02); CMP-06 e CMP-11 con l'icona della cartella al posto della freccia; in CMP-14 il campo «Nuova cartella» ha la cartella chiusa.
- Anche il pannello Sposta in (CMP-11) ha la cartella chiusa o aperta al posto della freccia (scelta di Manuel Cucca, 01/10/2026). Proposte dell'agente, da confermare: l'icona c'è anche per le cartelle senza sottocartelle, che prima non avevano la freccia; un clic sull'icona apre e chiude, come faceva la freccia; «Non organizzate» resta senza icona.
- Da allineare: i mockup di SC-01 e SC-03 (colonna e Sposta in), il codice (`Colonna.tsx`, `PannelloSpostaIn.tsx`) e le prove che cercano la freccia.
