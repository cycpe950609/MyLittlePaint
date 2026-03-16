import { defineConfig } from "vite";

export default defineConfig({
    base: './',
    server: {
        port: 8080,
    },
    esbuild: {
        jsxDev: false,
        jsx: "automatic",
        jsxImportSource: "@herp-inc/snabbdom-jsx",
    },
});
