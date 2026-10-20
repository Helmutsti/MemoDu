// Gli allegati nell'app (RF-18, DEC-169): i file nella cartella dei documenti dell'app con
// expo-file-system, le foto ridotte con expo-image-manipulator, «Foto» dalle foto del telefono,
// «File» dall'app File e «Apri» con l'anteprima di iOS (Quick Look).

import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LATO_ANTEPRIMA, type Disco, type RiduciFoto } from "@/nucleo/allegati";

const nel = (percorso: string) => new File(Paths.document, percorso);

export const discoExpo: Disco = {
  leggi: async (percorso) => {
    const f = nel(percorso);
    return f.exists ? await f.bytes() : null;
  },
  scrivi: async (percorso, byte) => {
    const f = nel(percorso);
    f.parentDirectory.create({ intermediates: true, idempotent: true });
    // Prima in un file a parte, poi al suo posto: un file a metà non sembra mai scaricato.
    const parziale = new File(f.parentDirectory, `${f.name}.parziale`);
    if (parziale.exists) parziale.delete();
    parziale.create();
    await parziale.write(byte);
    if (f.exists) f.delete();
    parziale.moveSync(f);
  },
  esiste: async (percorso) => nel(percorso).exists,
  togli: async (percorso) => {
    const cartella = new Directory(Paths.document, percorso);
    if (cartella.exists) return cartella.delete();
    const f = nel(percorso);
    if (f.exists) f.delete();
  },
  indirizzo: (percorso) => nel(percorso).uri,
};

/** L'anteprima di una foto (lato lungo 1440, JPEG) con le misure originali, come sul computer. */
export const riduciFotoExpo: RiduciFoto = async (byte, tipo) => {
  const temporaneo = new File(Paths.cache, `foto-${Date.now()}.${tipo}`);
  temporaneo.create({ overwrite: true });
  await temporaneo.write(byte);
  try {
    const originale = await ImageManipulator.manipulate(temporaneo.uri).renderAsync();
    const { width, height } = originale;
    const contesto = ImageManipulator.manipulate(temporaneo.uri);
    if (Math.max(width, height) > LATO_ANTEPRIMA)
      contesto.resize(width >= height ? { width: LATO_ANTEPRIMA } : { height: LATO_ANTEPRIMA });
    const salvata = await (
      await contesto.renderAsync()
    ).saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.85,
    });
    const jpeg = await new File(salvata.uri).bytes();
    return { jpeg, larghezza: width, altezza: height };
  } finally {
    if (temporaneo.exists) temporaneo.delete();
  }
};

/** Un file scelto, con il nome e i byte; null se si annulla. */
export interface FileScelto {
  nome: string;
  byte: Uint8Array;
}

const JPEG = [0xff, 0xd8, 0xff];

/**
 * «Foto»: dalle foto del telefono, in JPEG o PNG. Le foto HEIC dell'iPhone arrivano già
 * convertite in JPEG (rappresentazione compatibile), e il nome prende l'estensione giusta.
 */
export async function scegliFotoDaAllegare(): Promise<FileScelto | null> {
  const scelta = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (scelta.canceled || !scelta.assets?.length) return null;
  const foto = scelta.assets[0];
  const byte = await new File(foto.uri).bytes();
  let nome = foto.fileName || "foto.jpg";
  if (JPEG.every((b, i) => byte[i] === b) && !/\.jpe?g$/i.test(nome))
    nome = `${nome.replace(/\.[^.]*$/, "")}.jpg`;
  return { nome, byte };
}

/** «File»: dall'app File. */
export async function scegliFileDaAllegare(): Promise<FileScelto | null> {
  const scelta = await File.pickFileAsync({});
  if (scelta.canceled || !scelta.result) return null;
  const f = scelta.result;
  return { nome: f.name, byte: await f.bytes() };
}

/** «Apri»: il file a tutto schermo con l'anteprima di iOS (RB-119). */
export async function anteprimaDiIos(percorso: string, nome: string): Promise<void> {
  await nel(percorso).preview({ title: nome });
}
