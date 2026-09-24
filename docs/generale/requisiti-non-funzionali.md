# Requisiti non funzionali

<!-- Fase 1 della guida. -->

| Codice | Categoria | Requisito | Come si verifica |
|---|---|---|---|
| RNF-01 | Prestazioni | L'app si avvia in modo istantaneo e la scrittura non viene mai ostacolata: l'utente deve potersi fidare e iniziare subito a prendere note. Tutte le operazioni avvengono in locale; la sincronizzazione parte periodicamente in background e non blocca mai la scrittura | Nota rapida visibile entro 0,2 s dalla scorciatoia (Memodu in background). Programma completo pronto a scrivere entro 2 s dall'avvio da chiuso. Nessuna soglia sulla digitazione |
| RNF-02 | Sicurezza | Tutte le note sono cifrate end-to-end durante la sincronizzazione (RF-10). Workspace e singole note possono essere protetti da password (RF-09) | |
| RNF-03 | Privacy/GDPR | Non si applica nella prima fase: i dati sono solo del proprietario, su un server suo e cifrati end-to-end (DEC-05). Diventa obbligatoria con il servizio aperto al pubblico (ID-12) | |
| RNF-04 | Accessibilità | Conformità WCAG 2.1 AA. Le immagini nelle note hanno un testo alternativo, di default il nome del file (RF-03) | |
| RNF-05 | Lingue | Interfaccia in italiano, con i testi separati dal codice per poter aggiungere altre lingue in futuro | Nessun testo dell'interfaccia scritto direttamente nel codice |
| RNF-06 | Dispositivi e browser | Prima fase: app desktop per Windows e macOS, e versione web nel browser (DEC-04). Mobile parcheggiato (ID-11) | |
| RNF-07 | Disponibilità | Nessuna soglia nella prima fase: se il server non è raggiungibile si scrive sulla copia di lavoro e si sincronizza dopo (DEC-02). La versione web invece richiede il server raggiungibile | |
| RNF-08 | Usabilità | Interfaccia semplice e intuitiva, adatta a utenti di ogni fascia d'età | |
