// CMP-25 Barra di scorrimento (DEC-89): un'area che scorre con la barra sovrapposta di
// OverlayScrollbars. La barra del sistema non si vede; al suo posto un cursore sottile sopra il
// contenuto, che compare scorrendo o muovendo il mouse sull'area e sparisce con una dissolvenza
// (DEC-58). È della libreria e sta nell'area: si muove e sparisce con lei.

import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type { ReactElement, ReactNode } from "react";
import "./AreaScorrevole.css";

const OPZIONI = {
  overflow: { x: "hidden" },
  scrollbars: {
    theme: "os-theme-memodu",
    autoHide: "move",
    autoHideDelay: 800,
    clickScroll: false,
  },
} as const;

export function AreaScorrevole({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}): ReactElement {
  return (
    <OverlayScrollbarsComponent className={`area-scorrevole ${className}`} options={OPZIONI} defer>
      {children}
    </OverlayScrollbarsComponent>
  );
}
