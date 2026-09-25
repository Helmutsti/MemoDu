# Sincronizzazione – Schermate

<!-- Fasi 4 e 6 della guida. Wireframe e mockup restano nello strumento di design: qui si mettono i link. -->

L'impostazione generale è in `moduli/interfaccia/4-schermate.md`. La sincronizzazione non ha schermate proprie: è invisibile finché va tutto bene (RB-40).

## Avvisi di sincronizzazione (FL-07)
**Flussi:** FL-07 · **Componenti:** avviso

- **Wireframe:** [i tre avvisi](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-130) · [nota in conflitto](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=32-147)
- **Esportazioni:** `immagini/SC-01-avvisi.png`

In cima all'area della nota di SC-01, livello 50, uno alla volta:

| Avviso | Quando | Azione |
|---|---|---|
| Server irraggiungibile | Oltre la soglia (indicativa 24 ore, RB-40) | Ho capito |
| Credenziali rifiutate | Subito (SF-25) | Ho capito; la configurazione si corregge fuori dall'app (FL-08) |
| Errore di sincronizzazione | Subito (SF-32) | Ho capito |
| Nota in conflitto | Subito (RB-39) | Apri l'altra |

Visto su un dispositivo, l'avviso sparisce su tutti (RB-53).

---

## SC-05 – Accesso
Eliminata da DEC-13: le credenziali sono preimpostate e non esiste login. I wireframe restano nel file Figma e le esportazioni nella storia di git, come riferimento se il web (ID-19) richiederà un accesso.
