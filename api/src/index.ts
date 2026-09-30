import { HOST_API, INDIRIZZO_API, PORTA_API } from "@memodu/condiviso";
import { creaServer } from "./app.ts";
import { ArchivioNote, cartellaPredefinita } from "./archivio.ts";
import { ArchivioSincronizzazione, FILE_CREDENZIALI } from "./sincronizzazione.ts";

const cartella = cartellaPredefinita();
const sincronizzazione = new ArchivioSincronizzazione(cartella);
const nuove = sincronizzazione.preparaCredenziali(INDIRIZZO_API);
const server = creaServer(new ArchivioNote(cartella), sincronizzazione);
await server.listen({ host: HOST_API, port: PORTA_API });
console.log(`API di Memodu in ascolto su http://${HOST_API}:${PORTA_API}, database in ${cartella}`);
if (nuove) {
  // Si mostrano una volta sola (DEC-79): sulla stessa macchina l'app le trova già nel file.
  console.log(
    `Credenziali dell'installazione, scritte in ${FILE_CREDENZIALI} nella cartella dei dati:`,
  );
  console.log(JSON.stringify(nuove));
}
