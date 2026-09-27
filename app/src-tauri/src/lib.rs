// Nucleo Rust di Memodu. Nel frammento Must A fa solo area di notifica, scorciatoia globale
// e finestre (DEC-30): le note passano dall'API. Scorciatoia e nota rapida: attività 9.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Memodu non è riuscito ad avviarsi");
}
