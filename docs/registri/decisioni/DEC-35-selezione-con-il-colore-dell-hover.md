# DEC-35 – Elementi selezionati con il colore dell'hover

**Data:** 2026-09-28 · **Stato:** Accettata · **Idea di origine:** ID-23

## Contesto
Dalla Fase 5 (regola visiva 7) l'elemento selezionato ha la pillola scura (`sfondo-pieno`, testo e icone `su-pieno`): la nota aperta nella colonna (CMP-06), il filtro attivo (CMP-05), lo strumento attivo della pillola (CMP-10), il giorno scelto nel calendario (CMP-12). Provando l'app, Manuel Cucca la trova troppo contrastata (ID-23).

## Opzioni valutate
A) Tenere la pillola scura.
B) Selezione con lo stesso colore dell'hover (`sfondo-hover`).
C) Evidenziazione leggera più un pallino accanto al titolo (ID-23).

## Decisione
B, scelta da Manuel Cucca: le voci selezionate nella colonna e in tutti i pulsanti hanno lo stesso colore dell'hover, `sfondo-hover`, con testo e icone in `testo-primario`. Nella riga della colonna la selezione si distingue dall'hover per il peso del testo (Interfaccia/Controllo attivo). Il pallino di ID-23 resta da valutare.

## Conseguenze
- Stato Attivo di CMP-05, CMP-06, CMP-10 e CMP-12 aggiornato, in Figma e nel codice.
- Regola visiva 7 in `moodboard.md` e uso di `sfondo-pieno` e `sfondo-hover` in `tokens.md` aggiornati.
- `sfondo-pieno` resta per pulsante primario (anche diviso), suggerimento, interruttore acceso e casella spuntata della checklist.
- Contrasti: `testo-primario` su `sfondo-hover` ≥ 9,88:1, già verificato.
- Con il mouse sopra, una voce selezionata non cambia colore.
