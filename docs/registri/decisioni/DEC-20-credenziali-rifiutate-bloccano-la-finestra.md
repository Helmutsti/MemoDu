# DEC-20 – Credenziali mancanti o rifiutate bloccano la finestra

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
FL-08 conteneva una deduzione da confermare: con credenziali mancanti o rifiutate l'app funziona lo stesso sulla copia di lavoro e mostra solo un avviso. Manuel Cucca non l'ha confermata: senza credenziali valide l'app si blocca.

## Opzioni valutate
Come si blocca:
A) Sola lettura: le note si leggono e si cercano, non si scrive.
B) La finestra non si apre: al suo posto una schermata di blocco.

Quando si blocca:
A) Solo con credenziali mancanti o rifiutate dal server.
B) Anche quando il server è irraggiungibile.

## Decisione
B e A: con credenziali mancanti nel file di configurazione, o rifiutate dal server, la finestra non si apre e compare una schermata di blocco (SC-07). Senza rete non si blocca nulla: si lavora sulla copia di lavoro come prima (DEC-02).

- All'avvio l'app si apre subito sulla copia di lavoro (RNF-01); se mancano le credenziali si apre direttamente la schermata di blocco.
- Se il server rifiuta le credenziali mentre l'app è aperta, la finestra principale e la nota rapida passano alla schermata di blocco. Quello che era già scritto resta sulla copia di lavoro e si sincronizza quando le credenziali tornano valide.
- Riprova rilegge il file di configurazione e riprova il collegamento.

## Conseguenze
- Nuova RB-57 in FL-08; RB-40 non ha più l'avviso "credenziali rifiutate"; EN-08 perde quel tipo.
- FL-08 riscritto; RF-14 con un punto sul blocco.
- Nuova SC-07 Collegamento bloccato (wireframe); nell'avviso di FL-07 restano due tipi.
- Design system: variante Blocco di CMP-19 Stato vuoto.
- DEC-02 resta valida: il blocco non riguarda la rete.
