# DEC-96 – Info sotto il titolo e ricerca avanzata

**Data:** 2026-10-01 · **Stato:** Accettata · **Idea di origine:** ID-32, ID-33

## Contesto
Manuel Cucca ha chiesto di ridisegnare la finestra dei dettagli (ID-32, CMP-24: una finestra modale al centro con il velo, aperta dal menu `···` o dal tasto destro sulla nota) e di avere un «filtro a tutto schermo» quando i risultati non stanno nella card della ricerca (ID-33, CMP-13). Proposte nelle pagine [Proposta · Dettagli](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=136-2382) e [Proposta · Filtro a tutto schermo](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=132-2382) del file dei mockup.

## Opzioni valutate
Per i dettagli: A) una pagina al posto del foglio, come Impostazioni; B) un pannello fisso a destra, non modale; C) una comparsa sotto il titolo del percorso; C2) come C, ma senza il menu `···`, con Chiudi nota ed Elimina nella comparsa (idea di Manuel Cucca).
Per aprirla dal titolo, che per DEC-71 con un clic si rinominava: a) una freccia accanto al titolo; b) il clic sul titolo apre la comparsa e il titolo si rinomina lì dentro; c) la comparsa compare già passando sul titolo.
Per la ricerca: A) i risultati al posto del foglio; B) una finestra grande con i filtri sempre aperti; C) l'elenco con l'anteprima della nota. Per aprirla: dalla sola ricerca, da un pulsante dedicato, oppure dalla card con una voce in più.

## Decisione
Scelte di Manuel Cucca, 01/10/2026:
- **C2 con b.** Un clic sul titolo del percorso apre **Info** (CMP-24, tipo Comparsa), sotto il titolo e senza velo: titolo, date, tag, cartella con «Sposta in…», poi Chiudi nota ed Elimina. Il menu `···` in alto a destra sparisce. Il titolo si rinomina nel campo di Info; passando sul titolo non compare più la comparsa dei metadati (CMP-27).
- **Tasto destro su una nota della colonna:** Info, Sposta in…, Elimina. Info apre la stessa Info come finestra al centro con il velo (CMP-24, tipo Finestra), con «Info» e la ✕ in testa e senza Chiudi nota.
- **«Info» ovunque** al posto di «Dettagli»: voci di menu, titoli, documenti e libreria.
- **Ricerca avanzata (B):** una finestra grande al centro con il velo (CMP-29), con i filtri sempre aperti a sinistra e i risultati a destra. Si apre da «Mostra tutti i risultati (n)» in fondo alla card (CMP-13) o con Ctrl + Maiusc + K, con lo stesso testo e gli stessi filtri. La card resta per le ricerche veloci.

Proposte dell'agente, da confermare: Info larga 360 con il contenuto allineato alle icone delle voci; nella Finestra niente Chiudi nota; la ricerca avanzata larga 1040 e alta 820; testo e filtri tornano alla card quando la ricerca avanzata si chiude.

## Conseguenze
- Supera la finestra dei dettagli di DEC-44 (modale dal menu `···`), la comparsa dei metadati e il titolo che si rinomina con un clic nel percorso di DEC-71, e il menu `···` della nota aperta (DEC-55, DEC-63, DEC-68 per la posizione di Chiudi nota, che resta con Ctrl + W).
- Design system: CMP-24 diventa «Info» con i tipi Comparsa e Finestra; CMP-27 superato; CMP-13 con «Mostra tutti i risultati»; nuovo CMP-29 Ricerca avanzata; CMP-09 senza il menu `···`; CMP-26 con il clic sul titolo che apre Info. Il vecchio componente della finestra resta nella libreria, segnato come superato, finché i mockup che lo usano non sono aggiornati.
- Da allineare: i criteri CA-04.2 … CA-04.5 e CA-06.1 (che citano il menu `···` e la finestra), i criteri di RF-08 per la ricerca avanzata, i mockup di SC-01 e SC-03 e il codice (`FinestraDettagli`, `ComparsaMetadati`, `Percorso`, menu `···`).
