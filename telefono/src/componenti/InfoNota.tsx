// CMP-24 Info sul telefono, nel foglio dal basso (CMP-51), con le righe e i testi del computer:
// la cartella («Non organizzata» nella radice, altrimenti «Lavoro › Clienti»), la data di
// creazione, la fine validità, i tag; sotto l'ultima modifica e, separata, «Elimina», che manda
// la nota nel Cestino. Toccando la cartella si apre Sposta in…; dal 21/10/2026 date e tag si
// cambiano anche qui (scelte di Manuel Cucca): una data apre nello stesso foglio il calendario
// del computer (CMP-12) con «Oggi» e «Ripristina» o «Nessuna fine validità»; i tag aprono
// «Cerca o crea un tag» con le spunte, e tenendo premuto un tag «Elimina tag…» con la conferma
// del computer (RB-19). Ogni modifica vale subito (RB-06).

import {
  Brain,
  Calendar,
  Check,
  CircleAlert,
  Folder,
  Plus,
  Search,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Foglio } from "@/componenti/Foglio";
import { CalendarioMese, giornoDiOggi } from "@/componenti/FoglioData";
import { Pulsante } from "@/componenti/Pulsante";
import { giornoDi, scriviGiorno, testoModificata } from "@/dati/date";
import { useNegozio } from "@/dati/negozio";
import { livelliTag, type Nota } from "@/nucleo/archivio";
import { misura, raggio, spazio, testo, useColori } from "@/tema";

/** Testo della conferma di eliminazione con il numero di note (RB-19), come sul computer. */
function testoConferma(note: number): string {
  const sotto = "Vengono eliminati anche i suoi sotto-tag.";
  if (note === 0) return `Nessuna nota lo usa. ${sotto}`;
  if (note === 1) return `Lo usa 1 nota: resterà intatta, solo senza questo tag. ${sotto}`;
  return `Lo usano ${note} note: resteranno intatte, solo senza questo tag. ${sotto}`;
}

type Vista =
  "righe" | "creata" | "fine" | "tag" | { elimina: { id: string; percorso: string; note: number } };

function Riga({
  icona: Icona,
  onPress,
  nome,
  dopo,
  children,
}: {
  icona: LucideIcon;
  onPress?: () => void;
  nome?: string;
  dopo?: React.ReactNode;
  children: React.ReactNode;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={nome}
      style={({ pressed }) => [stili.riga, pressed && { backgroundColor: c.sfondoHover }]}
    >
      <Icona size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
      <View style={stili.testoRiga}>{children}</View>
      {dopo}
    </Pressable>
  );
}

export function InfoNota({
  visibile,
  nota: iniziale,
  cartella,
  onSposta,
  onSpostaInBrainet,
  onElimina,
  onChiudi,
}: {
  visibile: boolean;
  nota: Nota;
  /** Il percorso della cartella, «Lavoro/Clienti»; vuoto nella radice. */
  cartella: string;
  /** La riga della cartella apre Sposta in…, come sul computer. */
  onSposta: () => void;
  /** «Sposta in Brainet», solo con Brainet acceso e per una nota di CLOUD (RB-130, DEC-147). */
  onSpostaInBrainet?: () => void;
  onElimina: () => void;
  onChiudi: () => void;
}) {
  const c = useColori();
  const { archivio, modificato } = useNegozio();
  const [nota, setNota] = useState(iniziale);
  const [vista, setVista] = useState<Vista>("righe");
  const [tutti, setTutti] = useState<{ id: string; percorso: string; note: number }[]>([]);
  const [cerca, setCerca] = useState("");
  useEffect(() => setNota(iniziale), [iniziale]);
  useEffect(() => {
    if (!visibile) {
      setVista("righe");
      setCerca("");
    }
  }, [visibile]);
  const rileggi = async () => {
    if (!archivio) return;
    const i = await archivio.notaPerInfo(nota.id);
    if (i) setNota(i.nota);
    setTutti(await archivio.tuttiITag());
    modificato();
  };
  useEffect(() => {
    if (vista === "tag") void archivio?.tuttiITag().then(setTutti);
  }, [vista, archivio]);
  const cambiaDate = async (cambi: {
    creata_scelta?: string | null;
    fine_validita?: string | null;
  }) => {
    await archivio?.impostaDate(nota.id, cambi);
    await rileggi();
    setVista("righe");
  };
  const alterna = async (t: { id: string; percorso: string }) => {
    if (!archivio) return;
    if (nota.tag.includes(t.percorso)) await archivio.togliTag(nota.id, t.id);
    else await archivio.aggiungiTag(nota.id, t.percorso);
    await rileggi();
  };
  const crea = async () => {
    if (!archivio || !livelliTag(cerca).length) return;
    await archivio.aggiungiTag(nota.id, cerca);
    setCerca("");
    await rileggi();
  };
  const visti = useMemo(() => {
    const f = cerca.trim().toLowerCase();
    return f ? tutti.filter((t) => t.percorso.toLowerCase().includes(f)) : tutti;
  }, [tutti, cerca]);
  const nuovo = livelliTag(cerca).join("/");
  const esiste = tutti.some((t) => t.percorso.toLowerCase() === nuovo.toLowerCase());

  const testoRiga = [testo.controllo, { color: c.testoPrimario }];
  const creata = nota.creata_scelta ? scriviGiorno(nota.creata_scelta) : giornoDi(nota.creata);
  const titolo =
    vista === "creata"
      ? "Data di creazione"
      : vista === "fine"
        ? "Fine validità"
        : vista === "tag"
          ? "Tag"
          : typeof vista === "object"
            ? `Eliminare il tag «${vista.elimina.percorso}»?`
            : "Info";
  return (
    <Foglio visibile={visibile} titolo={titolo} onChiudi={onChiudi}>
      {vista === "creata" ? (
        <CalendarioMese
          scelto={nota.creata_scelta ?? giornoDi(nota.creata).split("/").reverse().join("-")}
          voci={[
            {
              etichetta: "Oggi",
              onPress: () => void cambiaDate({ creata_scelta: giornoDiOggi() }),
            },
            {
              etichetta: "Ripristina",
              dopo: giornoDi(nota.creata),
              onPress: () => void cambiaDate({ creata_scelta: null }),
            },
          ]}
          onScegli={(g) => void cambiaDate({ creata_scelta: g })}
        />
      ) : vista === "fine" ? (
        <CalendarioMese
          scelto={nota.fine_validita}
          voci={[
            {
              etichetta: "Oggi",
              onPress: () => void cambiaDate({ fine_validita: giornoDiOggi() }),
            },
            {
              etichetta: "Nessuna fine validità",
              onPress: () => void cambiaDate({ fine_validita: null }),
            },
          ]}
          onScegli={(g) => void cambiaDate({ fine_validita: g })}
        />
      ) : vista === "tag" ? (
        <>
          <View style={[stili.campo, { backgroundColor: c.sfondoCampo }]}>
            <Search size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
            <TextInput
              allowFontScaling={false}
              value={cerca}
              onChangeText={setCerca}
              onSubmitEditing={() => void crea()}
              placeholder="Cerca o crea un tag"
              placeholderTextColor={c.testoTenue}
              accessibilityLabel="Cerca o crea un tag"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              style={[
                testo.controllo,
                stili.flessibile,
                stili.campoTesto,
                { color: c.testoPrimario },
              ]}
            />
          </View>
          <ScrollView style={stili.elenco} keyboardShouldPersistTaps="handled">
            {nuovo && !esiste ? (
              <Pressable
                onPress={() => void crea()}
                accessibilityRole="button"
                style={({ pressed }) => [stili.riga, pressed && { backgroundColor: c.sfondoHover }]}
              >
                <Plus size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
                <Text allowFontScaling={false} style={[testoRiga, stili.flessibile]}>
                  Crea il tag «{nuovo}»
                </Text>
              </Pressable>
            ) : null}
            {visti.map((t) => {
              const scelto = nota.tag.includes(t.percorso);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => void alterna(t)}
                  onLongPress={() => setVista({ elimina: t })}
                  accessibilityRole="menuitem"
                  accessibilityState={{ checked: scelto }}
                  accessibilityHint="Tieni premuto per eliminare il tag"
                  style={({ pressed }) => [
                    stili.riga,
                    pressed && { backgroundColor: c.sfondoHover },
                  ]}
                >
                  <Text allowFontScaling={false} style={[testoRiga, stili.flessibile]}>
                    {t.percorso}
                  </Text>
                  {scelto ? (
                    <Check
                      size={misura.icona}
                      color={c.testoPrimario}
                      strokeWidth={misura.tratto}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : typeof vista === "object" ? (
        <>
          <Text allowFontScaling={false} style={[testo.messaggio, { color: c.testoTenue }]}>
            {testoConferma(vista.elimina.note)}
          </Text>
          <View style={stili.pulsanti}>
            <Pulsante
              etichetta="Elimina tag"
              tipo="primario"
              largo
              onPress={() =>
                void archivio
                  ?.eliminaTag(vista.elimina.id)
                  .then(rileggi)
                  .then(() => setVista("tag"))
              }
            />
            <Pulsante etichetta="Annulla" largo onPress={() => setVista("tag")} />
          </View>
        </>
      ) : (
        <>
          <View style={stili.righe}>
            <Riga
              icona={Folder}
              onPress={onSposta}
              nome={`Cartella ${cartella ? cartella.split("/").join(" › ") : "Non organizzata"}: Sposta in…`}
            >
              <Text allowFontScaling={false} style={testoRiga} numberOfLines={2}>
                {cartella ? cartella.split("/").join(" › ") : "Non organizzata"}
              </Text>
            </Riga>
            <Riga
              icona={Calendar}
              onPress={() => setVista("creata")}
              nome={`Data di creazione: Creata il ${creata}`}
              dopo={
                nota.creata_scelta ? (
                  <Pressable
                    onPress={() => void cambiaDate({ creata_scelta: null })}
                    accessibilityRole="button"
                    accessibilityLabel={`Ripristina la data di sistema, ${giornoDi(nota.creata)}`}
                    hitSlop={spazio.icona}
                  >
                    {({ pressed }) => (
                      <Text
                        allowFontScaling={false}
                        style={[
                          testo.controllo,
                          { color: pressed ? c.testoPrimario : c.testoTenue },
                        ]}
                      >
                        Ripristina
                      </Text>
                    )}
                  </Pressable>
                ) : null
              }
            >
              <Text allowFontScaling={false} style={testoRiga}>
                Creata il {creata}
              </Text>
            </Riga>
            <Riga icona={CircleAlert} onPress={() => setVista("fine")} nome="Fine validità">
              <Text
                allowFontScaling={false}
                style={[
                  testo.controllo,
                  { color: nota.fine_validita ? c.testoPrimario : c.testoTenue },
                ]}
              >
                {nota.fine_validita
                  ? `Fine validità il ${scriviGiorno(nota.fine_validita)}`
                  : "Nessuna fine validità"}
              </Text>
            </Riga>
            <Riga icona={Tag} onPress={() => setVista("tag")} nome="Tag">
              {nota.tag.length ? (
                <View style={stili.tag}>
                  {nota.tag.map((nome) => (
                    <View key={nome} style={[stili.pillola, { backgroundColor: c.sfondoCampo }]}>
                      <Text
                        allowFontScaling={false}
                        style={[testo.controllo, { color: c.testoPrimario }]}
                      >
                        {nome}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text allowFontScaling={false} style={[testo.controllo, { color: c.testoTenue }]}>
                  Aggiungi un tag
                </Text>
              )}
            </Riga>
            <Text
              allowFontScaling={false}
              style={[testo.dettaglio, stili.modificata, { color: c.testoTenue }]}
            >
              {testoModificata(nota.modificata)}
            </Text>
          </View>
          <View style={[stili.separatore, { backgroundColor: c.bordoDivisoreTenue }]} />
          {onSpostaInBrainet ? (
            <Pressable
              onPress={onSpostaInBrainet}
              accessibilityRole="button"
              style={({ pressed }) => [stili.riga, pressed && { backgroundColor: c.sfondoHover }]}
            >
              <Brain size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
              <Text allowFontScaling={false} style={[testo.controllo, { color: c.testoPrimario }]}>
                Sposta in Brainet
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onElimina}
            accessibilityRole="button"
            style={({ pressed }) => [stili.riga, pressed && { backgroundColor: c.sfondoHover }]}
          >
            <Trash2 size={misura.icona} color={c.testoErrore} strokeWidth={misura.tratto} />
            <Text allowFontScaling={false} style={[testo.controllo, { color: c.testoErrore }]}>
              Elimina
            </Text>
          </Pressable>
        </>
      )}
    </Foglio>
  );
}

const stili = StyleSheet.create({
  righe: { gap: 0 },
  riga: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    minHeight: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  testoRiga: { flex: 1, paddingVertical: spazio.elemento },
  flessibile: { flex: 1 },
  tag: { flexDirection: "row", flexWrap: "wrap", gap: spazio.elemento },
  pillola: {
    paddingHorizontal: spazio.controlloPiccolo,
    paddingVertical: spazio.elemento,
    borderRadius: raggio.pillola,
  },
  modificata: { paddingHorizontal: spazio.controllo, paddingTop: spazio.elemento },
  separatore: { height: 1 },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  campoTesto: { padding: 0 },
  elenco: { maxHeight: misura.riga * 6 },
  pulsanti: { gap: spazio.icona, marginTop: spazio.icona },
});
