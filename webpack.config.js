/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */
import path from "path";
import { fileURLToPath } from "url";
import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CompressionPlugin from 'compression-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const module = {
    entry: {
        index: "./ts/main.ts"
    },
    devServer: {
        compress: true,
        port: 8080,
    },
    output: {
        filename: "js/[name].bundle.js",
        chunkFilename: "js/[name].chunk.js",
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
            filename: 'index.html',
        }),
        new CopyPlugin({
            patterns: [
                { from: "favicon.ico", to: "favicon.ico" },
                { from: "css", to: "css" },
                { from: "img", to: "img" }
            ]
        }),
        new CompressionPlugin(),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/i,
                use: [
                    {
                        loader: "babel-loader",
                        options: { presets: ["@babel/preset-env"] }
                    },
                    { loader: "ts-loader" }
                ]
            },
            {
                test: /\.js$/i,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                        plugins: [
                            [
                                "@babel/plugin-transform-react-jsx",
                                {
                                    "importSource": "@herp-inc/snabbdom-jsx",
                                    "runtime": "automatic"
                                }
                            ]
                        ]
                    }
                }
            },
            // {
            //     test: /\.html$/,
            //     exclude: /node_modules/,
            //     use: { loader: 'html-loader' }
            // },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: { extensions: [".ts", ".tsx", ".js"] },
};

export default module;
