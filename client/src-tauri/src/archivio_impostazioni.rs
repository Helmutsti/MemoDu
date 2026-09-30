// Impostazioni nella copia di lavoro (EN-07, DEC-91). La scorciatoia della nota rapida, una per
// Windows e una per macOS, sta nell'elemento «impostazioni», che si sincronizza come gli altri e
// vale su tutti i dispositivi (RB-52). Tema e nome del dispositivo restano qui, nella tabella
// `dispositivo`, che non ha trigger. Senza un valore vale quello di default.

use rusqlite::{params, OptionalExtension};

use super::{Archivio, Esito};

/// L'unico elemento delle impostazioni: uno per account, con lo stesso id su tutti i
/// dispositivi. È un UUID fisso perché il server accetta solo UUID come id degli elementi.
pub const ID: &str = "00000000-0000-4000-8000-000000000001";

/// Per quale sistema è la scorciatoia (RB-52).
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Sistema {
    Windows,
    Macos,
}

impl Sistema {
    pub fn attuale() -> Self {
        if cfg!(target_os = "macos") {
            Sistema::Macos
        } else {
            Sistema::Windows
        }
    }

    fn colonna(self) -> &'static str {
        match self {
            Sistema::Windows => "scorciatoia_windows",
            Sistema::Macos => "scorciatoia_macos",
        }
    }
}

impl Archivio {
    /// La scorciatoia scelta per il sistema; None se vale quella di default.
    pub fn scorciatoia(&mut self, sistema: Sistema) -> Esito<Option<String>> {
        let sql = format!("SELECT {} FROM impostazioni WHERE id = ?", sistema.colonna());
        self.con_riconnessione(|a| {
            Ok(a.db.query_row(&sql, [ID], |r| r.get::<_, Option<String>>(0)).optional()?.flatten())
        })
    }

    /// Cambia la scorciatoia del sistema; None torna a quella di default («Ripristina»).
    pub fn imposta_scorciatoia(&mut self, sistema: Sistema, valore: Option<&str>) -> Esito<()> {
        let colonna = sistema.colonna();
        let sql = format!(
            "INSERT INTO impostazioni (id, {colonna}) VALUES (?1, ?2)
             ON CONFLICT(id) DO UPDATE SET {colonna} = excluded.{colonna}"
        );
        self.con_riconnessione(|a| {
            a.db.execute(&sql, params![ID, valore])?;
            Ok(())
        })
    }

    /// Un valore che vale solo su questo dispositivo (tema, nome); None se non è mai stato scelto.
    pub fn valore_dispositivo(&mut self, chiave: &str) -> Esito<Option<String>> {
        self.con_riconnessione(|a| {
            Ok(a.db
                .query_row("SELECT valore FROM dispositivo WHERE chiave = ?", [chiave], |r| r.get(0))
                .optional()?)
        })
    }

    /// Scrive un valore del dispositivo; None lo toglie e torna quello di default.
    pub fn imposta_valore_dispositivo(&mut self, chiave: &str, valore: Option<&str>) -> Esito<()> {
        self.con_riconnessione(|a| {
            match valore {
                Some(v) => a.db.execute(
                    "INSERT OR REPLACE INTO dispositivo (chiave, valore) VALUES (?, ?)",
                    params![chiave, v],
                )?,
                None => a.db.execute("DELETE FROM dispositivo WHERE chiave = ?", [chiave])?,
            };
            Ok(())
        })
    }
}
