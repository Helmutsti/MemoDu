# DEC-21 – Token semantici per ogni categoria

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Costruendo il mockup di SC-01 (Fase 6) la colonna ha preso margini di 16 e 20 px scelti sul momento, e 20 non era nemmeno nella scala. Il giro dei componenti ha mostrato che tutti gli spazi erano legati a token, ma solo ai primitivi (`spazio-4` … `spazio-48`): nessuno diceva il ruolo dello spazio, e lo stesso ruolo aveva valori diversi (tra le sezioni della colonna 8, nello stato vuoto 24; tra blocchi 12 o 16). La guida chiedeva già i token semantici, ma non diceva che valgono per ogni categoria e non lo controllava alla chiusura della Fase 5: per questo i colori li avevano e gli spazi no.

## Opzioni valutate
A) Lasciare gli spazi sui primitivi e fissare solo i casi dubbi.
B) Dare un ruolo a ogni spazio (regola visiva 12 e token semantici) e rendere il livello semantico obbligatorio per ogni categoria, con un controllo nel criterio di completamento della Fase 5.

## Decisione
Opzione B, approvata da Manuel Cucca: dieci ruoli (elemento 4, icona 8 e icona piccola 4, controllo 12 e controllo piccolo 8, pulsante 16, blocco 16, gruppo 24, flottante 8, contenitore 16, finestra 24) più due token di componente per l'interruttore. Il titolo della nota dista dai metadati uno `spazio-blocco` (16), non un'eccezione da 12.

## Conseguenze
- `guida-documentazione.md`, Fase 5: il livello semantico vale per ogni categoria; il criterio di completamento aggiunge "nessun componente usa un primitivo o un valore senza token".
- `design-system/moodboard.md`: regola 12. `design-system/tokens.md`: tabella degli spazi; i primitivi degli spazi sono nascosti nella libreria.
- Componenti ricollegati ai ruoli in Figma. Cambiano le misure in quattro punti: sezioni della colonna 8 → 24 (CMP-14), gruppi del pannello Date 12 → 16 (CMP-11), icona e testo dell'avviso 12 → 8 (CMP-15), voci della checklist 8 → 4 (CMP-20); il cursore del campo non ha più 1 px di distanza dal testo (CMP-03).
- La Fase 5 del frammento Must si riapre e si richiude con questa passata: il controllo sui componenti non trova primitivi né valori senza token.
