# Telefono – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. -->

Memodu sull'iPhone, in React Native (DEC-156): le stesse note del computer, sincronizzate e cifrate, con un'interfaccia nativa per il tocco. Il computer resta su Tauri.

## Già deciso
- Prima schermata: la colonna a riquadri (DEC-154, DEC-160): Impostazioni in alto a destra, Cloud in un riquadro con il Cestino come ultima riga, sotto il riquadro Brainet (Journal, Entità, Calendario), in fondo la ricerca e la penna di Nuova nota (ID-55, scelte di Manuel Cucca del 19 e del 20/10/2026). Accanto al titolo della sezione nessun numero (DEC-159). Cartelle e riquadri si aprono a tendina.
- Le righe delle note si fanno scorrere a sinistra per Sposta ed Elimina; Elimina manda nel Cestino senza conferma (ID-55); una riga sola aperta alla volta, che si chiude al primo tocco altrove. Tenendo premuta una riga si apre il suo menu (CMP-53).
- La nota si apre a tutto schermo con il tondo per tornare indietro e Info in alto (CMP-50, proposta C); Info sale dal basso come foglio (ID-54); i formati in una barra sopra la tastiera, chiusa dal tondo con la freccia giù.
- Editor della nota: lo stesso editor del computer in vista Markdown (DEC-162), con i caratteri che restano quelli scritti (DEC-165); titolo e testo della nota alle misure del computer (DEC-164).
- Scala del telefono: ogni misura del computer × 15/13, righe compatte (DEC-161).
- La ricerca con i filtri in basso, sopra la ricerca; la penna se ne va mentre si cerca.
- Icona dell'app uguale a quella del Mac (DEC-163).
- Locale non c'è sul telefono (scelta di Manuel Cucca del 19/10/2026).
- Installazione dal Mac con l'account Apple gratuito, da rifare ogni 7 giorni, con il Mac e il telefono sulla stessa rete (Manuel Cucca, 19/10/2026): con la VPN il Mac non trova il telefono.

## Perimetro della prima versione
Proposta dell'agente, approvata da Manuel Cucca il 19/10/2026 («vai avanti»):
- **Subito, fatto:** accesso con email e password come sul computer; note sincronizzate e cifrate, che restano sul telefono anche senza rete; la lista a riquadri; aprire e scrivere una nota con la barra dei formati sopra la tastiera; nuova nota; ricerca; Elimina facendo scorrere la riga.
- **Subito dopo, fatto il 20/10/2026:** Info (da leggere, con Sposta in… dalla cartella), Sposta in…, cartelle con la pressione lunga, Cestino, Impostazioni (account, nome del dispositivo, Cambia password, Dispositivi collegati, tema, ricerca), ricerca con i filtri.
- **Info modificabile (scelte di Manuel Cucca del 21/10/2026):**
  - le righe del computer, ognuna con il suo tocco: la cartella apre Sposta in…, una data apre il foglio con il calendario del computer (CMP-12), i tag il foglio «Tag»; ogni modifica vale subito (RB-06);
  - data di creazione: il mese con le frecce, oggi evidenziato, il giorno scelto pieno; un tocco su un giorno lo sceglie e chiude il foglio; in fondo «Oggi» e «Ripristina» con la data di sistema, che torna a quella (RB-21); in Info, se è stata cambiata, «Ripristina» anche a destra della riga;
  - fine validità: lo stesso foglio, in fondo «Oggi» e «Nessuna fine validità», che la toglie (RB-20);
  - tag: «Cerca o crea un tag» e tutti i tag con la spunta su quelli della nota; un tocco mette o toglie; un nome nuovo dà «Crea il tag «…»» (RB-17, RB-18, RB-22); tenendo premuto un tag «Elimina tag…» con la conferma del computer (RB-19; proposta dell'agente, da confermare);
  - «Scegli le date…» nei filtri Creazione e Modifica apre lo stesso calendario e sceglie un giorno solo (DEC-126).
- **Brainet, passo 1, fatto il 20/10/2026:** Journal, Entità, pagina dell'entità e Calendario da leggere; nelle note pillole e aree si vedono e una pillola apre la sua entità.
- **Brainet, passo 2, fatto il 20/10/2026:** @ con i suggerimenti, aree dalla selezione, Sposta in Brainet, tipo, unione e foto delle entità.
- **«Scrivi» in Brainet (DEC-168), dal 20/10/2026:** prima riga del riquadro Brainet; apre una pagina nuova con giorno e ora sopra, come sul computer.
- **Brainet, passo 3: allegati (scelte di Manuel Cucca del 20/10/2026, DEC-169):**
  - nella barra sopra la tastiera la graffetta, dopo i formati, anche con Brainet spento: apre il foglio «Allega» con «Foto» (le foto del telefono) e «File» (l'app File); in più si può incollare una foto;
  - gli allegati si vedono come sul computer: pillola del documento, bolla o foto piccola, media, grande; senza rete una foto non ancora scaricata è un riquadro con il nome;
  - un tocco su un allegato apre il foglio con il nome del file: «Apri» (il file a tutto schermo con l'anteprima di iOS), «Dimensioni» (solo per le foto su una riga loro: Piccola, Media, Grande) e «Togli»; niente condivisione né «Mostra nella cartella»;
  - limiti, tipi e avvisi come sul computer (RB-115), con l'avviso del telefono (CMP-57).

## Scelte tecniche
- Base: Expo SDK 58, nella cartella `telefono/`, fuori dal workspace npm (React Native vuole la sua versione di React); Metro legge anche `client/src` e `condiviso/src` (DEC-162).
- Nucleo in TypeScript con gli stessi byte del computer: Argon2id nativo con libsodium (DEC-158), HKDF e XChaCha20-Poly1305 con @noble; la copia di lavoro come blocchi con tutti i campi.
- Navigazione a pila di expo-router senza le barre di sistema di iOS: barre e pulsanti sono componenti del design system (CMP-50 … CMP-57).
- Righe da far scorrere e pressione lunga con Gesture Handler; tastiera e barra dei formati con Keyboard Controller; animazioni con Reanimated.
- Icone: Lucide, come sul computer.
- Appunti con `expo-clipboard` (DEC-166); foto delle entità con `expo-image-picker` ed `expo-image-manipulator` (DEC-167).
- Allegati: file nella cartella dell'app, scelta dall'app File e anteprima di iOS con `expo-file-system` (DEC-169).

## Piano per portare l'intera app (richiesta di Manuel Cucca del 19/10/2026)
Proposta dell'agente, in quest'ordine:
1. **Componenti del telefono** che sul computer non ci sono, disegnati nella libreria alla scala del telefono (DEC-161, che supera DEC-157): barra della nota per tornare indietro e aprire Info, foglio dal basso, azioni della riga scorsa, menu della pressione lunga, barra in basso, testata della schermata, conferma, avviso. Le schermate usano solo questi e i componenti del computer ingranditi.
2. **Nucleo:** accesso con email e password, chiavi (Argon2id e HKDF), cifratura (XChaCha20-Poly1305) e sincronizzazione con le stesse regole e gli stessi byte del computer (`client/src-tauri/src/`), scritti in TypeScript; copia di lavoro con lo stesso schema.
3. **Schermate:** Info come foglio dal basso (date, tag, cartella), Sposta in…, cartelle (nuova, rinomina, elimina, con la pressione lunga), Cestino (ripristina, elimina per sempre, svuota), ricerca con i filtri, Impostazioni (account, tema), accesso.
4. **Brainet:** Journal, Entità e pagina dell'entità, Calendario, pillole @ e aree nel testo, allegati.

Restano solo sul computer: Locale, nota rapida, icona nella barra dei menu, scorciatoie da tastiera, finestra e colonna fissata.

## Requisiti
Il telefono porta i requisiti del computer (RF-01 … RF-16 nei moduli `note`, `organizzazione`, `sincronizzazione`, `interfaccia`) con le regole e i testi del computer; qui stanno solo le differenze del telefono, elencate sopra. Le domande ancora aperte sono in `8-test.md`.

## Fuori dal modulo
Nessun codice del registro idee per ora. Locale resta solo sul computer (scelta di Manuel Cucca del 19/10/2026).
