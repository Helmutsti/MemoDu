// Il clic sul velo delle finestre al centro (CMP-16, CMP-22): fa come Esc (DEC-124). Conta solo
// se comincia e finisce sul velo, così trascinare per selezionare il testo di un campo fino a
// fuori non chiude la finestra.

import { useRef, type MouseEvent } from "react";

export function useClicSulVelo(
  suFuori: () => void,
  attivo = true,
): { onMouseDown: (e: MouseEvent) => void; onClick: (e: MouseEvent) => void } {
  const cominciatoSulVelo = useRef(false);
  return {
    onMouseDown: (e) => {
      cominciatoSulVelo.current = e.target === e.currentTarget;
      // Il clic sul velo non porta il focus fuori dalla finestra.
      if (cominciatoSulVelo.current) e.preventDefault();
    },
    onClick: (e) => {
      const valido = cominciatoSulVelo.current && e.target === e.currentTarget;
      cominciatoSulVelo.current = false;
      if (valido && attivo) suFuori();
    },
  };
}
