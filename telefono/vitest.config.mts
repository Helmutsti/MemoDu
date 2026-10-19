import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Prove delle parti senza interfaccia (nucleo, formati), sul computer.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"] },
});
