// CMP-02 Icona: icone Lucide (DEC-15) a 16 px con tratto 1,5, oppure 12 e 24 dove il
// componente lo prevede. Sono decorative: il nome sta sul controllo che le contiene.

import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";

export function Icona({
  di: Componente,
  misura = 16,
  piena = false,
}: {
  di: LucideIcon;
  misura?: 12 | 16 | 24;
  /** Riempita del colore del tratto: per uno stato attivo, come la puntina della colonna fissata. */
  piena?: boolean;
}): ReactElement {
  return (
    <Componente
      size={misura}
      strokeWidth={1.5}
      absoluteStrokeWidth
      fill={piena ? "currentColor" : "none"}
      aria-hidden="true"
    />
  );
}
