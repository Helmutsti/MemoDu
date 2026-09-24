# Catalogo delle sfighe

<!-- Fase 2 della guida. Si arricchisce nel tempo con i problemi incontrati davvero. -->

Per ogni flusso si scorre l'elenco e ci si chiede: *"può succedere qui? E se succede, cosa accade?"*. Per ogni sfiga pertinente il flusso deve prevedere **rilevamento**, **comunicazione** all'utente e **via d'uscita**.

## L'utente
| Codice | Sfiga | Domanda da porsi |
|---|---|---|
| SF-01 | Doppio click / invio ripetuto | Premere due volte crea due ordini o due pagamenti? |
| SF-02 | Abbandono a metà | Si salva una bozza? Restano dati orfani? |
| SF-03 | Tasto indietro e refresh | Cosa succede tornando indietro dopo l'invio, o ricaricando durante l'invio? |
| SF-04 | Più schede aperte | La stessa operazione in due tab contemporaneamente. |
| SF-05 | Cambio idea | Si può annullare o modificare dopo la conferma? Fino a quando? |
| SF-06 | Input strani ma legittimi | Apostrofi, accenti, testi lunghissimi, spazi, testo da Word, emoji, virgola o punto. |
| SF-07 | Dimenticanze | Password dimenticata, email sbagliata, link di conferma mai cliccato. |

## Rete e dispositivo
| Codice | Sfiga | Domanda da porsi |
|---|---|---|
| SF-08 | Connessione che cade a metà | L'operazione è andata a buon fine? L'utente lo sa? |
| SF-09 | Connessione lenta | Cosa vede durante l'attesa? Può fare danni cliccando ancora? |
| SF-10 | App in background o schermo bloccato | Cosa succede all'operazione in corso? |
| SF-11 | Dispositivo limitato | Schermo piccolo, zoom al 200%, browser datato, cookie o JavaScript bloccati. |

## Il tempo
| Codice | Sfiga | Domanda da porsi |
|---|---|---|
| SF-12 | Sessione scaduta | Il lavoro in corso si perde? |
| SF-13 | Scadenza superata durante l'operazione | Cosa succede se l'offerta scade al pagamento? |
| SF-14 | Fusi orari e ora legale | Un evento alle 2:30 nella notte del cambio d'ora esiste? |
| SF-15 | Date particolari | 29 febbraio, fine mese, fine anno, mezzanotte, date nel passato. |

## I dati
| Codice | Sfiga | Domanda da porsi |
|---|---|---|
| SF-16 | Vuoto | Nessun risultato, lista vuota, primo utilizzo. |
| SF-17 | Troppo | 10.000 elementi, testi lunghissimi, file enormi. |
| SF-18 | Valori limite | Zero, negativi, il massimo, il massimo +1. |
| SF-19 | Duplicati | Stesso utente registrato due volte, stesso elemento inserito due volte. |
| SF-20 | Riferimenti spariti | Si usa qualcosa che nel frattempo è stato eliminato. |
| SF-21 | File problematici | Formato sbagliato, file corrotto, nome con caratteri speciali, foto ruotata. |

## La concorrenza
| Codice | Sfiga | Domanda da porsi |
|---|---|---|
| SF-22 | Modifica simultanea | Due utenti modificano lo stesso dato: chi vince? L'altro viene avvisato? |
| SF-23 | Ultimo posto disponibile | Due persone lo prenotano nello stesso secondo. |
| SF-24 | Modifiche "da sopra" | L'admin cambia prezzi, permessi o configurazione durante l'uso. |

## Permessi e account
| Codice | Sfiga | Domanda da porsi |
|---|---|---|
| SF-25 | Utente disattivato o ruolo cambiato | Cosa succede se accade mentre è collegato? |
| SF-26 | Accesso via link diretto | Si raggiunge una pagina o un dato che non spetta? |
| SF-27 | Account non verificato | Prova a fare operazioni riservate. |

## I sistemi esterni
| Codice | Sfiga | Domanda da porsi |
|---|---|---|
| SF-28 | Pagamento rifiutato | Carta scaduta, fondi insufficienti, 3D Secure abbandonato. |
| SF-29 | Pagamento riuscito ma conferma mai arrivata | I soldi sono stati presi ma il sistema non lo sa. |
| SF-30 | Servizio esterno lento o fuori uso | Mappe, email, SMS, API di terzi. |
| SF-31 | Notifiche perse o doppie | Email in spam, SMS non arrivato, notifica ricevuta due volte. |

## Il sistema
| Codice | Sfiga | Domanda da porsi |
|---|---|---|
| SF-32 | Errore del server a metà operazione | Resta tutto a metà? |
| SF-33 | Manutenzione o versioni diverse | Aggiornamento durante l'uso, app vecchia con server nuovo. |

## I malintenzionati
| Codice | Sfiga | Domanda da porsi |
|---|---|---|
| SF-34 | Manipolazione di URL e ID | Cambiando `/ordine/123` in `/ordine/124` si vede l'ordine di un altro? |
| SF-35 | Tentativi ripetuti | Login a forza bruta, invio massivo di moduli, abuso di funzioni gratuite. |
| SF-36 | Input malevolo | Codice inserito nei campi di testo o nei file caricati. |

## Sfighe specifiche del progetto
Le sfighe incontrate davvero, in test o in produzione, si aggiungono qui a partire da SF-37.

| Codice | Sfiga | Domanda da porsi | Scoperta il | Origine |
|---|---|---|---|---|
| | | | | |
