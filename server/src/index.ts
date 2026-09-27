import { HOST_API, PORTA_API } from "@memodu/condiviso";
import { creaServer } from "./app.ts";

const server = creaServer();
await server.listen({ host: HOST_API, port: PORTA_API });
console.log(`API di Memodu in ascolto su http://${HOST_API}:${PORTA_API}`);
