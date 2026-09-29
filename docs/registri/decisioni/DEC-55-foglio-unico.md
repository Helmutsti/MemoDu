# DEC-55 – Foglio unico: niente barra del programma, colonna che compare a sinistra

**Data:** 2026-09-29 · **Stato:** Superata da DEC-56 (solo per come si richiude la colonna aperta) · **Idea di origine:** ID-30

## Contesto
La finestra principale (SC-01) aveva la barra del titolo del sistema e la colonna sempre visibile. Manuel Cucca vuole un aspetto più pulito: il foglio della nota come unica interfaccia. DEC-54 (proposta) teneva la barra cambiandole solo colore.

## Opzioni valutate
A) Barra del sistema dello stesso colore dell'app (DEC-54).
B) Foglio unico: niente barra; in alto a destra solo ··· e i pulsanti della finestra; la colonna compare a sinistra quando serve e si può fissare.

## Decisione
Scelta di Manuel Cucca: **B**, come disegnata nella pagina [Proposta · Foglio unico](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=70-1636) del file Mockup.
- Niente barra del programma. In alto a destra ··· (Altre azioni) e i pulsanti _ [] X; su Windows li disegna Memodu uguali a quelli del sistema, su macOS restano i tre pallini del sistema su una barra trasparente. Si trascina la finestra dalla fascia in alto (32 px); il doppio clic la ingrandisce.
- Colonna chiusa: nessuna icona. Con il mouse entro 48 px dal bordo sinistro compare «| →» in alto a sinistra (anche con il focus da tastiera); allontanandosi sparisce.
- «| →» apre la colonna sopra il foglio, con l'ombra dei flottanti; il foglio non si sposta. «← |» la richiude; scegliere una nota non la chiude.
- La puntina fissa la colonna: resta aperta e il foglio si sposta a destra, come prima; la puntina piena la sblocca. Memodu ricorda la scelta anche alla riapertura.
- macOS: dove stanno «| →», «← |» e la puntina rispetto ai tre pallini è da decidere; per ora dopo i pallini.

## Conseguenze
- DEC-54 è superata: la barra non c'è più.
- Fase 5 riaperta: nuove icone Lucide panel-left-open, panel-left-close e pin nel design system; libreria da ripubblicare.
- Aggiornati SC-01 e i mockup della finestra principale; codice: finestra senza cornice su Windows, barra trasparente su macOS, pulsanti della finestra, colonna nascosta, aperta o fissata.
- Si perde il menu di aggancio di Windows 11 sul pulsante Ingrandisci (i pulsanti non sono più quelli del sistema).
