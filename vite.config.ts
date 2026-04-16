import { defineConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: './',
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'My Little Paint',
                short_name: 'Painter',
                theme_color: '#000000',
                icons: [{
                    src: "icons/icon-512.svg",
                    sizes: '512x512',
                    type: 'image/svg+xml',
                    purpose: 'any',
                }]
            },
            devOptions: {
                enabled: true
            }
        })
    ],
    server: {
        port: 8080,
    },
    esbuild: {
        jsxDev: false,
        jsx: "automatic",
        jsxImportSource: "@herp-inc/snabbdom-jsx",
    },
});
