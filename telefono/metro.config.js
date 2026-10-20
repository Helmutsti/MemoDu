// L'editor della nota è quello del computer (client/src/editor), in un componente DOM (DEC-162):
// Metro guarda anche quei file, le regole condivise (condiviso/src) e le librerie della radice del
// repository (CodeMirror, Inter).
// React resta una sola copia, quella del telefono, anche per i file del computer.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const radice = path.resolve(__dirname, "..");
const config = getDefaultConfig(__dirname);

config.watchFolders = [
  path.join(radice, "client/src"),
  path.join(radice, "condiviso/src"),
  path.join(radice, "node_modules"),
];
config.resolver.nodeModulesPaths = [
  path.join(__dirname, "node_modules"),
  path.join(radice, "node_modules"),
];

const soloDelTelefono = /^(react|react-dom)(\/.*)?$/;
const quiDentro = path.join(__dirname, "package.json");
config.resolver.resolveRequest = (contesto, nome, piattaforma) =>
  contesto.resolveRequest(
    soloDelTelefono.test(nome) ? { ...contesto, originModulePath: quiDentro } : contesto,
    nome,
    piattaforma,
  );

module.exports = config;
