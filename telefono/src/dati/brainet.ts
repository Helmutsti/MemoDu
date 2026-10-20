// I dati di Brainet per le schermate del telefono: si rileggono a ogni cambio della copia di
// lavoro, anche quando la sincronizzazione porta note o entità nuove.

import { useEffect, useState } from "react";
import { useNegozio } from "@/dati/negozio";
import type { Entita, NotaBrainet, Stato } from "@/nucleo/brainet";

export interface DatiBrainet {
  note: NotaBrainet[];
  entita: Map<string, Entita>;
  stati: Stato[];
}

export function useDatiBrainet(): DatiBrainet | null {
  const { archivio, versione } = useNegozio();
  const [dati, setDati] = useState<DatiBrainet | null>(null);
  useEffect(() => {
    let vivo = true;
    void archivio?.datiBrainet().then((d) => vivo && setDati(d));
    return () => {
      vivo = false;
    };
  }, [archivio, versione]);
  return dati;
}
