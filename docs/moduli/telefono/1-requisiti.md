# Telefono – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. -->

Memodu sull'iPhone, in React Native (DEC-156): le stesse note del computer, sincronizzate e cifrate, con un'interfaccia nativa per il tocco. Il computer resta su Tauri.

## Già deciso
- Prima schermata: la colonna a riquadri (DEC-154): titolo grande, ricerca, tessere di Brainet (Journal, Entità, Calendario), Cloud in un riquadro con il riassunto da chiuso (DEC-155), Impostazioni in alto, «Nuova nota» e Cestino in basso (ID-55, scelte di Manuel Cucca del 19/10/2026).
- Le righe delle note si fanno scorrere a sinistra per Sposta ed Elimina; Elimina manda nel Cestino senza conferma (ID-55).
- La nota si apre a tutto schermo con «‹ cartella» e Info in alto; i formati in una barra sopra la tastiera; Info sale dal basso come foglio (ID-54).
- Locale non c'è sul telefono (scelta di Manuel Cucca del 19/10/2026).
- Installazione dal Mac con l'account Apple gratuito, da rifare ogni 7 giorni (Manuel Cucca, 19/10/2026).

## Perimetro della prima versione
Proposta dell'agente, approvata da Manuel Cucca il 19/10/2026 («vai avanti»):
- **Subito:** accesso con email e password come sul computer; note sincronizzate e cifrate, che restano sul telefono anche senza rete; la lista a riquadri; aprire e scrivere una nota con la barra dei formati sopra la tastiera; nuova nota; ricerca; Elimina facendo scorrere la riga.
- **Subito dopo:** Info dal basso (date, tag, cartella), Sposta in…, Cestino, Impostazioni.
- **Più avanti:** Brainet (Journal, Entità, Calendario): nella prima versione le tessere non ci sono.

## Scelte dell'agente, da confermare
- Base: Expo SDK 58, nella cartella `telefono/`, per ora fuori dal workspace npm (React Native vuole la sua versione di React).
- Barra in alto, titolo grande «Memodu», ricerca e barra in basso sono quelli nativi di iOS (expo-router, Stack.Title, Stack.SearchBar, Stack.Toolbar): «Nuova nota» sta nella barra in basso, con l'icona di sistema della matita.
- Righe da far scorrere con il gesto nativo (Gesture Handler); tastiera e barra dei formati con Keyboard Controller.
- Icone: Lucide nella lista, come sul computer; nelle barre di sistema i simboli di iOS.
- Editor della nota: il campo di testo nativo di iOS, con il testo in Markdown e la barra dei formati che inserisce i segni (#, **, -, - [ ]).
- Scala dei testi del telefono in `telefono/src/tema.ts`: controlli 17, dettagli 13, titolo della nota 28.
- Prima della sincronizzazione, nella versione di sviluppo, alcune note di esempio.

## Piano per portare l'intera app (richiesta di Manuel Cucca del 19/10/2026)
Proposta dell'agente, in quest'ordine:
1. **Componenti del telefono** che sul computer non ci sono, disegnati nella libreria alla scala del telefono (DEC-157): barra della nota per tornare indietro e aprire Info, foglio dal basso, azioni della riga scorsa, menu della pressione lunga, barra in basso, testata della schermata, conferma, avviso. Le schermate usano solo questi e i componenti del computer ingranditi.
2. **Nucleo:** accesso con email e password, chiavi (Argon2id e HKDF), cifratura (XChaCha20-Poly1305) e sincronizzazione con le stesse regole e gli stessi byte del computer (`client/src-tauri/src/`), scritti in TypeScript; copia di lavoro con lo stesso schema.
3. **Schermate:** Info come foglio dal basso (date, tag, cartella), Sposta in…, cartelle (nuova, rinomina, elimina, con la pressione lunga), Cestino (ripristina, elimina per sempre, svuota), ricerca con i filtri, Impostazioni (account, tema), accesso.
4. **Brainet:** Journal, Entità e pagina dell'entità, Calendario, pillole @ e aree nel testo, allegati.

Restano solo sul computer: Locale, nota rapida, icona nella barra dei menu, scorciatoie da tastiera, finestra e colonna fissata.

## Requisiti
Da scrivere in Fase 1: le domande aperte sono in `8-test.md`.

## Fuori dal modulo
Nessun codice del registro idee per ora. Locale resta solo sul computer (scelta di Manuel Cucca del 19/10/2026).
