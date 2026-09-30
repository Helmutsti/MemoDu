# DEC-93 – Niente note sganciate per ora; Memodu in primo piano dalle impostazioni

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-92 anticipava le note sganciate (RF-12) nella prima fase. Mentre si scriveva il codice, Manuel Cucca ha deciso che per ora non hanno senso, ma che vuole comunque poter tenere Memodu sopra gli altri programmi.

## Opzioni valutate
Tenere le note sganciate come da DEC-92; toglierle e lasciare RF-12 *Should*; toglierle e tenere solo il primo piano, per la finestra principale.

## Decisione
Scelte di Manuel Cucca:
- Le note sganciate si tolgono: RF-12 torna *Should*, fuori dalla prima fase (DEC-01). Il codice scritto per DEC-92 non entra.
- Nelle impostazioni c'è **«Tieni Memodu in primo piano»**: la finestra principale resta sopra gli altri programmi.
- La posizione della voce nella pagina è **da rivedere**.

Proposte dell'agente, da confermare:
- È un interruttore (CMP-04) nel gruppo Generale, sotto «Avvia Memodu all'accensione», spento di default.
- Vale solo su questo dispositivo, come il tema e l'avvio all'accensione (RB-52), e resta dopo il riavvio.
- Vale per la finestra principale; le note rapide sono già sempre in primo piano (SC-02).

## Conseguenze
- Supera DEC-92.
- RF-12 torna *Should* e perde i criteri CA-12.1 … CA-12.7; SC-01 perde «Sgancia in una finestra» e lo stato «nota sganciata»; SC-06 e EN-07 hanno la voce nuova.
- Dal design system e dai mockup si tolgono le parti disegnate per DEC-92: icone Sgancia e Riaggancia, la proprietà Spuntata di CMP-07, la variante Nota sganciata di CMP-19 e i tre mockup delle note sganciate (scelta di Manuel Cucca).
