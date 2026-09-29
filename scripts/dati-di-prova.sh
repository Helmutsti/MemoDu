#!/bin/sh
# Set di dati «Smistare» per le prove a mano del frammento Must B (architettura/ambienti.md).
# Da lanciare con il server già avviato su una cartella di prova vuota:
#   MEMODU_CARTELLA="$HOME/Documents/Memodu-prove" npm run server
#   sh scripts/dati-di-prova.sh
# Non usarlo sulla cartella delle note vere.
set -e
API="http://127.0.0.1:4317"
invia() { curl -sf -X POST -H 'Content-Type: application/json' -d "$2" "$API$1" >/dev/null; }

invia /cartelle '{"genitore":"","nome":"Lavoro"}'
invia /cartelle '{"genitore":"Lavoro","nome":"Clienti"}'
invia /cartelle '{"genitore":"Lavoro","nome":"Progetti"}'
invia /cartelle '{"genitore":"","nome":"Personale"}'
invia /note '{"titolo":"Budget 2026","contenuto":"Voci principali del budget.","cartella":"Lavoro"}'
invia /note '{"titolo":"Riunione con i fornitori","contenuto":"Punti da discutere.","cartella":"Lavoro"}'
invia /note '{"titolo":"Rossi","contenuto":"Richiamare giovedì.","cartella":"Lavoro/Clienti"}'
invia /note '{"titolo":"Idee per il sito","contenuto":"Pagina dei prezzi più chiara."}'
invia /note '{"titolo":"Lista della spesa","contenuto":"- latte\n- pane"}'
invia /note '{"titolo":"Riunione di lunedì","contenuto":"Ordine del giorno."}'
echo "Dati di prova pronti."
