# DEC-124 – Le finestre col velo si chiudono con un clic fuori; la manina su tutto ciò che si clicca

**Data:** 2026-10-07 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Provando la 0.1.12 Manuel Cucca ha notato che la finestra di accesso (SC-05, CMP-22) non si chiude con un clic fuori e che sui pulsanti non compare la manina. Oggi è così per scelta dei documenti: le finestre al centro con il velo (accesso, CMP-22; conferme, CMP-16) si chiudono solo con Esc o con i loro pulsanti, mentre Info si chiude anche con un clic fuori (DEC-81). Sul cursore non c'è una regola: i pulsanti (CMP-01), le righe della colonna, le voci di menu e il percorso hanno la freccia, come nei programmi desktop; le righe delle impostazioni, i segmenti, i tag e i filtri della ricerca hanno la manina.

## Opzioni valutate
- Clic fuori: A) tutte le finestre col velo, come Esc; B) solo l'accesso.
- Manina: A) su tutto ciò che si clicca; B) solo sui pulsanti e dove c'è già; C) da nessuna parte.

## Decisione
Scelte di Manuel Cucca del 07/10/2026:
- **Clic fuori (A):** in ogni finestra al centro con il velo un clic sul velo fa come Esc: chiude senza fare niente. Vale per l'accesso (CMP-22, si chiude soltanto, senza scollegare) e per le finestre di conferma (CMP-16, come Annulla), come già per Info (DEC-81).
- **Manina (A):** il cursore a mano su tutto ciò che si clicca: pulsanti, voci di menu, righe della colonna e dell'albero, segmenti del percorso, righe delle impostazioni, scelte a segmenti, tag, filtri, risultati della ricerca, interruttori.

Deduzioni dell'agente, confermate da Manuel Cucca il 07/10/2026 con l'accettazione:
- Mentre l'accesso è in caricamento (Argon2id e risposta del server) il clic fuori non conta, come i pulsanti che sono fermi.
- Il clic fuori conta solo se comincia e finisce sul velo: selezionare il testo di un campo trascinando fino fuori dalla finestra non la chiude.
- Nei campi di testo resta il cursore del testo; sugli elementi disabilitati resta la freccia; sul testo della nota il cursore del testo.
- Dove sopra la finestra è aperto qualcos'altro (un menu, un avviso a livello 50), il primo clic fuori chiude prima quello, come in Info (DEC-81).

## Conseguenze
- `design-system/componenti.md`: una regola generale sul cursore e le schede di CMP-01, CMP-06, CMP-07, CMP-14, CMP-16, CMP-22 e CMP-26; nessun cambio in Figma (il cursore non si disegna).
- Codice: il velo di `ModuloAccesso.tsx` e di `FinestraConferma.tsx`; nei fogli di stile `cursor: default` diventa `cursor: pointer` dove l'elemento si clicca. Prove automatiche per il clic sul velo.
- Supera la sola chiusura con Esc delle finestre col velo (CMP-16, CMP-22) e il cursore a freccia sui pulsanti.
