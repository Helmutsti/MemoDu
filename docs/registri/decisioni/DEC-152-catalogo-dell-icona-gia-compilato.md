# DEC-152 – Il catalogo dell'icona di macOS si salva già compilato

**Data:** 2026-10-17 · **Stato:** Proposta · **Idea di origine:** —

## Contesto
Con DEC-151 Tauri compilava `icons/macos/Memodu.icon` in `Assets.car` durante il rilascio. Sul Mac di GitHub, con Xcode 26.6, `actool` si è fermato senza messaggi («Failed to create app Assets.car: failed to run actool») e la 1.1.1 è uscita solo per Windows.

## Opzioni valutate
A) Cercare la causa sul Mac di GitHub, con altri tentativi di rilascio.
B) Salvare nel repository `Assets.car` già compilato e darlo a Tauri al posto di `Memodu.icon`: Tauri lo copia e ne legge il nome con `assetutil`, senza `actool`.

## Decisione
B (proposta dell'agente, provata sul Mac con un pacchetto di prova: `CFBundleIconName` «Memodu», icona giusta in tema scuro). `Memodu.icon` resta la sorgente; dopo una modifica si ricompila con:
`xcrun actool icons/macos/Memodu.icon --compile <cartella> --app-icon Memodu --include-all-app-icons --enable-on-demand-resources NO --development-region it --target-device mac --minimum-deployment-target 11.0 --platform macosx --output-partial-info-plist <cartella>/info.plist`
e si copiano `Assets.car` in `icons/macos/` e `Memodu.icns` in `icons/icon.icns`. Tolto dal rilascio il passo che sceglieva Xcode 26. Completa DEC-151.

## Conseguenze
- Un file binario in più nel repository (circa 1 MB), da ricompilare a mano quando cambia l'icona.
- La 1.1.1 resta senza installatore per Mac; il Mac riparte dalla 1.1.2.
