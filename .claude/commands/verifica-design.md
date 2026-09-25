---
description: Controlla che componenti e mockup usino solo token e stili di ruolo (regola 12, DEC-21, DEC-22)
---

Verifica dei disegni. Sola lettura: non modificare nulla, né in Figma né nel repository. Carica la skill figma-use prima di usare `use_figma`.

File da controllare:
- Design system `ulmeeMyPHDFR0lSR9NquuE`, pagine "Componenti base" (19:9) e "Componenti composti" (19:10): solo i nodi dentro i componenti (COMPONENT e varianti), saltando i nodi dentro un'istanza.
- Mockup `18288YdcRf5vtWCtEefQYJ`, tutte le pagine: solo i frame il cui nome inizia con `SC-`.
- Mai la pagina Prove del Design system: lì le copie staccate sono volute.

Una chiamata `use_figma` per pagina, lanciate in parallelo; in ognuna `figma.skipInvisibleInstanceChildren = false`.

Controlli:
1. **Spazi:** `paddingLeft/Right/Top/Bottom` e `itemSpacing` diversi da 0 che non sono legati a una variabile, o sono legati a un primitivo (`spazio/<numero>`). Vale anche per i frame riempitivi il cui nome inizia con "spazio".
2. **Testi:** testi senza stile (`textStyleId` vuoto) o con uno stile che non è nella tabella "Tipografia" di `docs/design-system/tokens.md`. Un testo con più stili è ammesso solo se ogni pezzo ha uno stile in tabella (es. l'estratto di un risultato: testo in Interfaccia/Controllo, parola trovata in Interfaccia/Controllo attivo).
3. **Colori:** riempimenti e contorni SOLID visibili non legati a una variabile.
4. **Copie staccate (solo mockup):** frame con il nome di un componente della libreria che non sono istanze.

Risultato: una tabella per file, "Controllo | Problemi | Esempi" (al massimo 5 esempi, come `Componente / nodo.proprietà = valore`), poi il totale. Se è tutto a posto, una riga: "Nessun problema". Nessuna correzione e nessun commento: le correzioni si decidono dopo, con Manuel Cucca.

Quando usarlo: prima di chiudere una fase di disegno (4, 5, 6) e dopo ogni giro di modifiche ai componenti o ai mockup.
