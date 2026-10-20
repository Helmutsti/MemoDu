// CMP-13 Ricerca sul telefono (RF-08), con i testi e le regole del computer: i filtri Tag,
// Creazione e Modifica come pillole con la freccia giù, in basso sopra la ricerca (attive su
// sfondo-hover, con il valore: «Tag: lavoro», «Modifica: ultimi 7 giorni»); al posto della
// colonna, in un riquadro, i risultati: titolo, la
// frase con la parola evidenziata in testo-primario Medium, cartella e data; una nota nel cestino
// attenuata, con «nel cestino». Senza risultati «Nessuna nota trovata» e il suggerimento. I filtri
// si scelgono nel foglio dal basso (CMP-51): i tag con la spunta, più d'uno, e «Togli il filtro»;
// le date con i periodi del computer («Scegli le date…» con il calendario arriva dopo).

import { Check, ChevronDown, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  dettagliRisultato,
  divisioneEstratto,
  nomeFiltroTag,
  nomePeriodo,
  PERIODI,
  stessoPeriodo,
  type Periodo,
} from "../../../client/src/ricerca";
import { Foglio } from "@/componenti/Foglio";
import type { RisultatoRicerca } from "@/nucleo/ricerca";
import { misura, opacitaDisabilitato, raggio, spazio, t, testo, useColori } from "@/tema";

export interface Filtri {
  tag: string[];
  creata: Periodo | null;
  modificata: Periodo | null;
}

export const NESSUN_FILTRO: Filtri = { tag: [], creata: null, modificata: null };

function Pillola({
  etichetta,
  attiva,
  onPress,
}: {
  etichetta: string;
  attiva: boolean;
  onPress: () => void;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        stili.pillola,
        { backgroundColor: attiva || pressed ? c.sfondoHover : c.sfondoCampo },
      ]}
    >
      <Text allowFontScaling={false} style={[testo.etichetta, { color: c.testoPrimario }]}>
        {etichetta}
      </Text>
      <ChevronDown size={t(14)} color={c.iconaTenue} strokeWidth={misura.tratto} />
    </Pressable>
  );
}

function Voce({
  etichetta,
  scelta,
  onPress,
}: {
  etichetta: string;
  scelta?: boolean;
  onPress: () => void;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: !!scelta }}
      style={({ pressed }) => [stili.voce, pressed && { backgroundColor: c.sfondoHover }]}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[testo.controllo, stili.flessibile, { color: c.testoPrimario }]}
      >
        {etichetta}
      </Text>
      {scelta ? (
        <Check size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
      ) : null}
    </Pressable>
  );
}

/** I filtri Tag, Creazione e Modifica (RB-70), con i loro fogli: sopra la ricerca, in basso. */
export function FiltriRicerca({
  filtri,
  tuttiTag,
  onFiltri,
}: {
  filtri: Filtri;
  tuttiTag: string[];
  onFiltri: (f: Filtri) => void;
}) {
  const c = useColori();
  const [foglio, setFoglio] = useState<"tag" | "creata" | "modificata" | null>(null);
  const [cercaTag, setCercaTag] = useState("");
  const tagVisti = useMemo(() => {
    const f = cercaTag.trim().toLowerCase();
    return f ? tuttiTag.filter((x) => x.toLowerCase().includes(f)) : tuttiTag;
  }, [tuttiTag, cercaTag]);
  const periodo = foglio === "creata" ? filtri.creata : filtri.modificata;
  const scegliPeriodo = (p: Periodo | null) => {
    if (foglio === "creata" || foglio === "modificata") onFiltri({ ...filtri, [foglio]: p });
    setFoglio(null);
  };
  return (
    <>
      <View style={stili.filtri}>
        <Pillola
          etichetta={nomeFiltroTag(filtri.tag)}
          attiva={filtri.tag.length > 0}
          onPress={() => setFoglio("tag")}
        />
        <Pillola
          etichetta={filtri.creata ? `Creazione: ${nomePeriodo(filtri.creata)}` : "Creazione"}
          attiva={!!filtri.creata}
          onPress={() => setFoglio("creata")}
        />
        <Pillola
          etichetta={filtri.modificata ? `Modifica: ${nomePeriodo(filtri.modificata)}` : "Modifica"}
          attiva={!!filtri.modificata}
          onPress={() => setFoglio("modificata")}
        />
      </View>
      <Foglio visibile={foglio === "tag"} titolo="Tag" onChiudi={() => setFoglio(null)}>
        <View style={[stili.campo, { backgroundColor: c.sfondoCampo }]}>
          <Search size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
          <TextInput
            allowFontScaling={false}
            value={cercaTag}
            onChangeText={setCercaTag}
            placeholder="Cerca un tag"
            placeholderTextColor={c.testoTenue}
            accessibilityLabel="Cerca un tag"
            autoCorrect={false}
            autoCapitalize="none"
            style={[
              testo.controllo,
              stili.flessibile,
              stili.campoTesto,
              { color: c.testoPrimario },
            ]}
          />
        </View>
        <ScrollView style={stili.elenco} keyboardShouldPersistTaps="handled">
          {tagVisti.map((nome) => {
            const scelto = filtri.tag.includes(nome);
            return (
              <Voce
                key={nome}
                etichetta={nome}
                scelta={scelto}
                onPress={() =>
                  onFiltri({
                    ...filtri,
                    tag: scelto ? filtri.tag.filter((x) => x !== nome) : [...filtri.tag, nome],
                  })
                }
              />
            );
          })}
        </ScrollView>
        {filtri.tag.length ? (
          <>
            <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
            <Voce
              etichetta="Togli il filtro"
              onPress={() => {
                onFiltri({ ...filtri, tag: [] });
                setFoglio(null);
              }}
            />
          </>
        ) : null}
      </Foglio>

      <Foglio
        visibile={foglio === "creata" || foglio === "modificata"}
        titolo={foglio === "creata" ? "Creazione" : "Modifica"}
        onChiudi={() => setFoglio(null)}
      >
        <View>
          <Voce
            etichetta="Qualsiasi data"
            scelta={periodo === null}
            onPress={() => scegliPeriodo(null)}
          />
          {PERIODI.map((p) => (
            <Voce
              key={String(p.valore)}
              etichetta={p.etichetta}
              scelta={stessoPeriodo(periodo, p.valore)}
              onPress={() => scegliPeriodo(p.valore)}
            />
          ))}
        </View>
      </Foglio>
    </>
  );
}

/** I risultati in un riquadro, o «Nessuna nota trovata» (CMP-13, RB-35). */
export function RisultatiRicerca({
  risultati,
  cercato,
  onApri,
}: {
  /** null: ancora niente da mostrare (campo vuoto e nessun filtro, RB-33). */
  risultati: RisultatoRicerca[] | null;
  /** La ricerca è partita: senza risultati si dice «Nessuna nota trovata». */
  cercato: boolean;
  onApri: (r: RisultatoRicerca) => void;
}) {
  const c = useColori();
  return (
    <View style={stili.contenitore}>
      {risultati && (risultati.length || cercato) ? (
        <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>
          {risultati.length ? (
            risultati.map((r) => {
              const [prima, parola, dopo] = divisioneEstratto(r);
              const tenue = r.nelCestino ? { opacity: opacitaDisabilitato + 0.2 } : null;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => onApri(r)}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.titolo}, ${dettagliRisultato(r)}${r.nelCestino ? ", nel cestino" : ""}`}
                  style={({ pressed }) => [
                    stili.risultato,
                    pressed && { backgroundColor: c.sfondoHover },
                  ]}
                >
                  <View style={stili.titolo}>
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      style={[
                        testo.titolo,
                        stili.flessibile,
                        { color: r.nelCestino ? c.testoTenue : c.testoPrimario },
                      ]}
                    >
                      {r.titolo}
                    </Text>
                    {r.nelCestino ? (
                      <View style={[stili.etichetta, { backgroundColor: c.sfondoCampo }]}>
                        <Text
                          allowFontScaling={false}
                          style={[testo.dettaglio, { color: c.testoTenue }]}
                        >
                          nel cestino
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {r.estratto ? (
                    <Text
                      allowFontScaling={false}
                      numberOfLines={2}
                      style={[testo.dettaglio, tenue, { color: c.testoTenue }]}
                    >
                      {prima}
                      <Text
                        style={[
                          testo.etichetta,
                          { color: r.nelCestino ? c.testoTenue : c.testoPrimario },
                        ]}
                      >
                        {parola}
                      </Text>
                      {dopo}
                    </Text>
                  ) : null}
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={[testo.dettaglio, tenue, { color: c.testoTenue }]}
                  >
                    {dettagliRisultato(r)}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <View style={stili.vuoto}>
              <Text allowFontScaling={false} style={[testo.titolo, { color: c.testoPrimario }]}>
                Nessuna nota trovata
              </Text>
              <Text allowFontScaling={false} style={[testo.dettaglio, { color: c.testoTenue }]}>
                Prova con un&apos;altra parola o togli un filtro.
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const stili = StyleSheet.create({
  contenitore: { gap: spazio.icona },
  filtri: { flexDirection: "row", flexWrap: "wrap", gap: spazio.elemento },
  pillola: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.elemento,
    height: t(28),
    paddingLeft: spazio.controllo,
    paddingRight: spazio.icona,
    borderRadius: raggio.pillola,
  },
  riquadro: { borderRadius: raggio.contenitore, padding: spazio.elenco },
  risultato: {
    gap: 2,
    paddingHorizontal: spazio.controllo,
    paddingVertical: spazio.icona,
    borderRadius: raggio.interno,
  },
  titolo: { flexDirection: "row", alignItems: "center", gap: spazio.icona },
  flessibile: { flex: 1 },
  etichetta: { paddingHorizontal: spazio.elemento + 2, borderRadius: raggio.pillola },
  vuoto: { gap: spazio.elemento, padding: spazio.controllo },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  campoTesto: { paddingVertical: 0 },
  elenco: { maxHeight: t(280) },
  voce: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  filo: { height: 1 },
});
