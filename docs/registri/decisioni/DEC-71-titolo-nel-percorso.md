# DEC-71 – Il titolo della nota nel percorso in alto

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Nel foglio della nota aperta (SC-03) il titolo sta in cima, grande (Nota/Titolo), con sotto la riga dei metadati: ultima modifica e tag in sola lettura (DEC-44). Manuel Cucca: «voglio spostare il titolo in alto in una breadcrumb che mostra anche eventuali cartelle» e poi «dobbiamo trovare un posto più carino per tag e ultima modifica». Proposte nella pagina [Proposta · Titolo nel percorso](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=88-4408) del file dei mockup.

## Opzioni valutate
Per il percorso: A) nella fascia in alto, allineato al testo; B) in una pillola flottante a sinistra; C) al centro della fascia, come il titolo di una finestra.
Per ultima modifica e tag, con C: C1) in una riga sotto il percorso; C2) in una pillola flottante in basso; C3) nel margine a destra del testo; C4) nascosti, in un riquadro che compare passando sul titolo.

## Decisione
Scelte di Manuel Cucca: **C** e **C4**.
- Il titolo lascia il foglio e va nel **percorso** (CMP-26), al centro della fascia in alto: le cartelle che contengono la nota in testo tenue, il titolo in Interfaccia/Controllo attivo. Una nota non organizzata mostra solo il titolo.
- Ultima modifica e tag non stanno più nel foglio: compaiono nella **comparsa dei metadati** (CMP-27), un riquadro flottante sotto il titolo, passando con il mouse sul titolo del percorso. Si modificano sempre da Dettagli (CMP-24).
- Il foglio comincia direttamente con il testo.

Proposte dell'agente, confermate da Manuel Cucca il 07/10/2026:
- Il titolo si modifica cliccandolo nel percorso; Invio o Esc tornano al testo. Una nota nuova parte con il cursore nel testo, come oggi (CA-02.1); senza titolo il percorso mostra «Senza titolo» in testo tenue.
- Un clic su una cartella del percorso apre quella cartella nella colonna.
- Con più di due cartelle, quelle di mezzo diventano «…», che apre un menu con quelle nascoste.
- Il percorso ha il fondo del foglio, così il testo che scorre gli passa sotto senza sovrapporsi.
- La comparsa arriva dopo 500 ms di sosta sul titolo, come il suggerimento (CMP-08), e subito con il focus da tastiera sul titolo; sparisce lasciando il titolo, cliccandolo o con Esc.

## Conseguenze
- Supera, per la posizione, la riga dei metadati sotto il titolo di DEC-44 e il campo titolo in cima al foglio di SC-03.
- Design system: nuovi CMP-26 Percorso (con la parte interna Segmento del percorso) e CMP-27 Comparsa dei metadati; CMP-20 ha la proprietà «Mostra titolo».
- SC-03: mockup e codice aggiornati (`client/src/componenti/Percorso.tsx`, `ComparsaMetadati.tsx`). I mockup di SC-01 mostrano ancora il titolo nel foglio.
- Da decidere come si comporta il percorso su una finestra stretta e con i tre pallini di macOS, che stanno a sinistra.
