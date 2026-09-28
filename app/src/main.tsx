import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "./stili/token.css";
import "./stili/base.css";
import App from "./App";
import { NOTA_RAPIDA } from "./finestra";
import { NotaRapida } from "./schermate/NotaRapida";

if (NOTA_RAPIDA) document.body.classList.add("corpo-rapida");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{NOTA_RAPIDA ? <NotaRapida /> : <App />}</React.StrictMode>,
);
