# DEC-91 – Impostazioni sotto il cestino, con cinque sezioni

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
SC-06 prevedeva le impostazioni dalla voce del menu `···`, in una pagina al posto della nota con quattro sezioni: Generale, Ricerca, Dispositivo e Account (progettata ma non attiva, DEC-13, DEC-19). Manuel Cucca vuole una riga Impostazioni sotto il cestino che apra la pagina come il cestino, e decidere insieme il menu.

## Opzioni valutate
Sezioni: Generale, Sincronizzazione (nuova), Ricerca, Dispositivo, Tema (nuova, chiesta da Manuel Cucca). Per il tema: Sistema · Chiaro · Scuro; solo Chiaro · Scuro; anche un colore d'accento. Dove vale il tema: su questo dispositivo o su tutti. Cosa mostra la sincronizzazione: stato, server e credenziali, «Sincronizza ora», modifiche in attesa. La Ricerca: adesso o con la ricerca.

## Decisione
Scelte di Manuel Cucca:
- In fondo alla colonna, sotto la riga Cestino, la riga **Impostazioni**, che apre la pagina al posto della nota come il cestino (DEC-40). La voce Impostazioni esce dal menu `···`.
- **Generale:** scorciatoia della nota rapida (separata per Windows e macOS, sincronizzata, RB-52) e avvio di Memodu all'accensione.
- **Tema:** Sistema · Chiaro · Scuro, di default Sistema; vale solo su questo dispositivo.
- **Sincronizzazione:** solo lo stato e l'ultima sincronizzazione riuscita, in sola lettura.
- **Dispositivo:** nome di questo dispositivo (RB-51).
- **Ricerca:** arriva con la ricerca (RF-08). **Account:** esce dalla pagina.

Proposte dell'agente, accettate da Manuel Cucca il 30/09/2026 con il riepilogo:
- La scorciatoia si cambia cliccando il campo e premendo la combinazione nuova; se un altro programma la usa già lo si dice e resta la vecchia; «Ripristina» torna al valore di default.
- L'avvio all'accensione è un interruttore (CMP-04), spento di default, e vale solo su questo dispositivo.
- La riga Impostazioni ha l'icona dell'ingranaggio.

## Conseguenze
- Supera in SC-06 l'apertura dal menu `···` e la sezione Account; RB-52 vale per la scorciatoia, non per tema, avvio e nome del dispositivo.
- SC-01 (menu `···` e colonna), SC-06, EN-07 in `interfaccia/3-entita.md`.
- Da disegnare: la riga Impostazioni (CMP-06, variante come il cestino) e la pagina SC-06 con le righe di impostazione (CMP-18), l'interruttore (CMP-04), la scelta a tre del tema (componente da definire) e il campo della scorciatoia.
