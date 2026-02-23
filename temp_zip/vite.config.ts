import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const packData = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const VERS_STR = JSON.stringify(packData.version);

export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production';

    return {
        plugins: [
            vue({
                template: {
                    compilerOptions: {
                        whitespace: 'condense'
                    }
                }
            }),
            createHtmlPlugin({
                minify: isProduction,
                template: "index.html",
            }),
            viteStaticCopy({
                targets: [
                    {
                        src: 'data',
                        dest: ''
                    },
                ],
                watch: {
                    reloadPageOnChange: true
                }
            }),
        ],
        define: {
            __DEBUG: !isProduction,
            __CHEATS: !isProduction,
            __DIST: isProduction,
            __VERSION: VERS_STR,
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: !isProduction,
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: !isProduction
        },
        build: {
            outDir: 'dist',
            emptyOutDir: true,
        },
        resolve: {
            alias: {
                'modules': resolve(__dirname, 'src/modules'),
                'data': resolve(__dirname, 'data'),
                'ui': resolve(__dirname, 'src/ui'),
                '@': resolve(__dirname, './src'),
            }
        },
        server: {
            port: 3000,
            cors: true,
        },
    };
});
