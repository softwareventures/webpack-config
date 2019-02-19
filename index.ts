import CleanWebpackPlugin = require("clean-webpack-plugin");
import cssnano = require("cssnano");
import HtmlWebpackPlugin = require("html-webpack-plugin");
import MiniCssExtractPlugin = require("mini-css-extract-plugin");
import {dirname, normalize, resolve, sep} from "path";
import UglifyJsPlugin = require("uglifyjs-webpack-plugin");
import {Configuration, RuleSetUse} from "webpack";

// Placeholder variables for type declarations.
let webpackConfiguration: Required<Configuration>; // tslint:disable-line:prefer-const
let htmlOptions: Required<HtmlWebpackPlugin.Options>; // tslint:disable-line:prefer-const

namespace WebpackConfig { // tslint:disable-line:no-namespace
    export type Entry = typeof webpackConfiguration.entry;

    export interface Project {
        readonly rootDir?: string;
        readonly destDir?: string;
        readonly title: string;
        readonly vendor?: string;
        readonly entry?: Entry;
        html?: {
            readonly template?: typeof htmlOptions.template;
            readonly templateParameters?: typeof htmlOptions.templateParameters;
        };
    }
}

function WebpackConfig(project: WebpackConfig.Project): (env: any) => Configuration {
    return env => {
        const mode = env != null && env.production
            ? "production"
            : "development";

        const rootDir = project.rootDir == null && module.parent != null
            ? dirname(module.parent.filename)
            : project.rootDir;

        if (rootDir == null) {
            throw new Error("Could not determine project root path");
        }

        if (!isAbsolute(rootDir)) {
            throw new Error("Project root path must be absolute");
        }

        const destDir = project.destDir == null
            ? resolve(rootDir, "dist")
            : resolve(rootDir, project.destDir);

        const vendor = project.vendor == null
            ? "sv"
            : project.vendor;

        const vendorCssId = vendor.replace(/[[\]]/, "_");

        const entry: WebpackConfig.Entry = project.entry == null
            ? "./index"
            : project.entry;


        const htmlOptions: HtmlWebpackPlugin.Options = {
            title: project.title,
            inject: "head",
            minify: {
                collapseBooleanAttributes: true,
                collapseWhitespace: true,
                decodeEntities: true,
                removeAttributeQuotes: true,
                removeComments: true,
                removeOptionalTags: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                sortAttributes: true,
                sortClassName: true,
                useShortDocType: true
            } as any // FIXME Workaround outdated type definitions
        };

        if (project.html != null) {
            if (project.html.template != null) {
                htmlOptions.template = project.html.template;
            }

            if (project.html.templateParameters != null) {
                htmlOptions.templateParameters = project.html.templateParameters;
            }
        }

        const styleLoader: RuleSetUse = {
            loader: "style-loader",
            options: {
                hmr: mode === "development"
            }
        };

        const cssLoader: RuleSetUse = {
            loader: "css-loader",
            options: {
                importLoaders: mode === "development" ? 1 : 0,
                modules: "local",
                localIdentName: mode === "development"
                    ? "[local]-[sha256:contenthash:base64:5]"
                    : vendorCssId + "[sha256:contenthash:base64:5]",
                camelCase: true
            }
        };

        const postcssLoader: RuleSetUse = {
            loader: "postcss-loader",
            options: {
                plugins: [cssnano]
            }
        };

        const lessLoader: RuleSetUse = {
            loader: "less-loader",
            options: {
                strictUnits: true
            }
        };

        return {
            mode,
            entry,
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: {
                            loader: "ts-loader",
                            options: {
                                compilerOptions: {
                                    declaration: false,
                                    noEmit: false
                                }
                            }
                        },
                        exclude: /\/node_modules\//
                    },
                    {
                        test: /\.css$/,
                        use: mode === "development"
                            ? [styleLoader, cssLoader]
                            : [MiniCssExtractPlugin.loader, cssLoader, postcssLoader]
                    },
                    {
                        test: /\.less$/,
                        use: mode === "development"
                            ? [styleLoader, cssLoader, lessLoader]
                            : [MiniCssExtractPlugin.loader, cssLoader, postcssLoader, lessLoader]
                    },
                    {
                        test: /\.(png|jpe?g|gif)$/,
                        use: {
                            loader: "file-loader",
                            options: {
                                name: mode === "development"
                                    ? "[path][name]-[sha256:hash:base64:8].[ext]"
                                    : "[sha256:hash:base64:8].[ext]"
                            }
                        }
                    }
                ]
            },
            resolve: {
                extensions: [".tsx", ".ts", ".js"]
            },
            devtool: mode === "development"
                ? "inline-source-map"
                : false,
            optimization: mode === "development"
                ? {}
                : {
                    minimizer: [
                        new UglifyJsPlugin({
                            cache: true,
                            parallel: true,
                            uglifyOptions: {
                                compress: {
                                    passes: 2,
                                    unsafe: true,
                                    unsafe_math: true,
                                    unsafe_proto: true
                                },
                                output: {
                                    inline_script: false
                                }
                            }
                        })
                    ]
                },
            plugins: [
                ...mode === "development"
                    ? []
                    : [new CleanWebpackPlugin(destDir, {root: rootDir})],
                new MiniCssExtractPlugin(),
                new HtmlWebpackPlugin(htmlOptions)
            ],
            output: {
                filename: "index.js",
                path: destDir,
                devtoolModuleFilenameTemplate: "[resource-path]?[loaders]"
            }
        };
    };
}

export = WebpackConfig;

function isAbsolute(dir: string): boolean {
    return normalize(dir + sep) === normalize(resolve(dir) + sep);
}
