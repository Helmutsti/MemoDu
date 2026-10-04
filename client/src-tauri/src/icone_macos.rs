//! Dock macOS: usa le due versioni della M già fornite (DEC-108).

use objc2::{AllocAnyThread, MainThreadMarker};
use objc2_app_kit::{NSApplication, NSImage};
use objc2_foundation::NSData;
use tauri::Theme;

fn immagine_dock(tema: Theme) -> &'static [u8] {
    if tema == Theme::Dark {
        super::FINESTRA_TEMA_SCURO
    } else {
        super::FINESTRA_TEMA_CHIARO
    }
}

pub fn aggiorna_dock(tema: Theme) {
    let Some(mtm) = MainThreadMarker::new() else {
        eprintln!("Aggiornamento icona del Dock richiesto fuori dal thread principale");
        return;
    };
    let dati = NSData::with_bytes(immagine_dock(tema));
    let Some(immagine) = NSImage::initWithData(NSImage::alloc(), &dati) else {
        eprintln!("Immagine del Dock non leggibile");
        return;
    };
    // API pubblica di AppKit, sul thread principale.
    unsafe { NSApplication::sharedApplication(mtm).setApplicationIconImage(Some(&immagine)) };
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::image::Image;

    #[test]
    fn la_m_cambia_colore_conservando_la_sagoma() {
        let chiara = Image::from_bytes(immagine_dock(Theme::Light)).unwrap();
        let scura = Image::from_bytes(immagine_dock(Theme::Dark)).unwrap();
        assert_eq!((chiara.width(), chiara.height()), (scura.width(), scura.height()));
        let mut visibili = 0;
        let mut trasparenti = 0;
        for (nero, bianco) in chiara.rgba().chunks_exact(4).zip(scura.rgba().chunks_exact(4)) {
            assert_eq!(nero[3], bianco[3]);
            if nero[3] == 255 {
                assert_eq!(&nero[..3], &[31, 31, 31]);
                assert_eq!(&bianco[..3], &[237, 237, 237]);
                visibili += 1;
            } else if nero[3] == 0 {
                trasparenti += 1;
            }
        }
        assert!(visibili > 0);
        assert!(trasparenti > 0);
    }
}
