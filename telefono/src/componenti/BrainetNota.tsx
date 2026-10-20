// Brainet da scrivere nella nota sul telefono (RF-18, passo 2), con le regole e i testi del
// computer (client/src/brainet/EditorBrainet.tsx): i suggerimenti di @ sopra la barra dei
// formati (CMP-09 Suggerimenti: per tipo con il titolo, al massimo cinque per tipo, in fondo
// «Crea «…»», RB-104, RB-105) e il foglio dell'area (CMP-09 Area: gli Stati con il pallino e la
// spunta, poi le entità per tipo con la spunta, in fondo «Crea «…»», RB-107, RB-109).

import { Check, Plus } from "lucide-react-native";
import { Fragment } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { coloriStato, TITOLO_TIPO } from "@/componenti/Brainet";
import { Foglio } from "@/componenti/Foglio";
import { suggerisci, type Entita, type Stato, type TipoEntita } from "@/nucleo/brainet";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

const TIPI: (TipoEntita | null)[] = ["persona", "argomento", "evento", "oggetto", null];

/** «il preventivo arriva…»: al massimo 30 caratteri, per «Crea «…»». */
export function abbrevia(s: string, quanti = 30): string {
  const x = s.replace(/\s+/g, " ").trim();
  return x.length > quanti ? `${x.slice(0, quanti)}…` : x;
}

function Titolo({ testo: s }: { testo: string }) {
  const c = useColori();
  return (
    <Text
      allowFontScaling={false}
      style={[testo.titoloSezione, stili.titolo, { color: c.testoTenue }]}
    >
      {s}
    </Text>
  );
}

function Voce({
  etichetta,
  spunta,
  pallino,
  crea,
  disabilitata,
  onPress,
}: {
  etichetta: string;
  spunta?: boolean;
  pallino?: string;
  crea?: boolean;
  disabilitata?: boolean;
  onPress: () => void;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabilitata}
      accessibilityRole="menuitem"
      accessibilityState={{ checked: spunta }}
      style={({ pressed }) => [stili.voce, pressed && { backgroundColor: c.sfondoHover }]}
    >
      {pallino ? <View style={[stili.pallino, { backgroundColor: pallino }]} /> : null}
      {crea ? <Plus size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} /> : null}
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[testo.controllo, stili.flessibile, { color: c.testoPrimario }]}
      >
        {etichetta}
      </Text>
      {spunta ? (
        <Check size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
      ) : null}
    </Pressable>
  );
}

/** Le entità divise per tipo, con il titolo sopra ogni gruppo (ordine di @). */
function PerTipo({ elenco, voce }: { elenco: Entita[]; voce: (e: Entita) => React.ReactNode }) {
  return (
    <>
      {TIPI.map((tipo) => {
        const lista = elenco.filter((e) => (e.tipo ?? null) === tipo);
        if (!lista.length) return null;
        return (
          <Fragment key={tipo ?? "nessuno"}>
            <Titolo testo={TITOLO_TIPO[tipo ?? "nessuno"]} />
            {lista.map(voce)}
          </Fragment>
        );
      })}
    </>
  );
}

/** I suggerimenti di @ mentre si scrive il nome, sopra la barra dei formati. */
export function SuggerimentiChiocciola({
  domanda,
  entita,
  onScegli,
  onCrea,
}: {
  domanda: string;
  entita: Map<string, Entita>;
  onScegli: (e: Entita) => void;
  onCrea: (nome: string) => void;
}) {
  const c = useColori();
  const suggerite = suggerisci(domanda, entita);
  const nome = domanda.trim();
  const esiste = suggerite.some((e) => e.nome.toLowerCase() === nome.toLowerCase());
  if (!suggerite.length && !nome) return null;
  const ombra = {
    shadowColor: "#000",
    shadowOpacity: c.ombraOpacita,
    shadowRadius: t(24) / 2,
    shadowOffset: { width: 0, height: t(8) },
  };
  return (
    <View style={[stili.pannello, ombra, { backgroundColor: c.sfondoFlottante }]}>
      <ScrollView keyboardShouldPersistTaps="always" style={stili.scorre}>
        <PerTipo
          elenco={suggerite}
          voce={(e) => <Voce key={e.id} etichetta={e.nome} onPress={() => onScegli(e)} />}
        />
        {nome && !esiste ? (
          <>
            {suggerite.length ? (
              <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
            ) : null}
            <Voce etichetta={`Crea «${nome}»`} crea onPress={() => onCrea(nome)} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

/** Il foglio dell'area: stati ed entità con la spunta; la prima scelta crea l'area. */
export function FoglioArea({
  visibile,
  area,
  entita,
  stati,
  onAlterna,
  onCrea,
  onChiudi,
}: {
  visibile: boolean;
  area: { id: string | null; frase: string; stati: string[]; entita: string[]; citate: string[] };
  entita: Map<string, Entita>;
  stati: Stato[];
  onAlterna: (tipo: "stato" | "entita", id: string) => void;
  onCrea: (nome: string) => void;
  onChiudi: () => void;
}) {
  const c = useColori();
  // Le entità già legate restano nel foglio anche se non sono tra i suggerimenti.
  const elenco = suggerisci("", entita);
  for (const id of [...area.entita, ...area.citate]) {
    const e = entita.get(id);
    if (e && !elenco.some((x) => x.id === id)) elenco.push(e);
  }
  const nome = area.frase.trim().slice(0, 200);
  return (
    <Foglio visibile={visibile} titolo="Area" onChiudi={onChiudi}>
      <ScrollView style={stili.foglio} keyboardShouldPersistTaps="always">
        {stati.length ? (
          <>
            <Titolo testo="Stati" />
            {stati.map((s) => (
              <Voce
                key={s.id}
                etichetta={s.nome}
                pallino={coloriStato(c, s.colore).icona}
                spunta={area.stati.includes(s.id)}
                onPress={() => onAlterna("stato", s.id)}
              />
            ))}
            <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
          </>
        ) : null}
        <PerTipo
          elenco={elenco}
          voce={(e) => (
            <Voce
              key={e.id}
              etichetta={e.nome}
              spunta={area.entita.includes(e.id) || area.citate.includes(e.id)}
              // Un'entità citata dentro l'area è legata dalla sua pillola: si toglie togliendo la pillola.
              disabilitata={area.citate.includes(e.id)}
              onPress={() => onAlterna("entita", e.id)}
            />
          )}
        />
        {nome ? (
          <>
            <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
            <Voce
              etichetta={area.id ? "Crea…" : `Crea «${abbrevia(nome)}»`}
              crea
              onPress={() => onCrea(nome)}
            />
          </>
        ) : null}
      </ScrollView>
    </Foglio>
  );
}

const stili = StyleSheet.create({
  pannello: { borderRadius: raggio.contenitore, padding: spazio.elenco, maxHeight: t(260) },
  scorre: { flexGrow: 0 },
  foglio: { maxHeight: t(420) },
  titolo: { paddingHorizontal: spazio.controllo, paddingTop: spazio.icona, paddingBottom: 2 },
  voce: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  pallino: { width: 9, height: 9, borderRadius: 5 },
  flessibile: { flex: 1 },
  filo: { height: 1, marginVertical: spazio.elemento },
});
