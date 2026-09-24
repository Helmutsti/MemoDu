# Interfaccia – Entità

<!-- Fase 3 della guida. -->

## Diagramma ER
```mermaid
erDiagram
    ENTITA_A ||--o{ ENTITA_B : "ha"
    ENTITA_A {
        id identificativo
        string nome
    }
    ENTITA_B {
        id identificativo
        string stato
    }
```

## EN-00 – [Nome entità]
**Descrizione:** 

| Attributo | Tipo | Obbligatorio | Vincoli | Note |
|---|---|---|---|---|
| | | | | |

- **Chi la crea:** 
- **Chi la modifica:** 
- **Cancellazione:** definitiva | archiviazione
- **Dati sensibili:** [quali attributi, chi può vederli, per quanto tempo si conservano]
