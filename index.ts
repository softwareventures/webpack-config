import {CleanWebpackPlugin} from "clean-webpack-plugin";
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
        readonly html?: {
            readonly template?: typeof htmlOptions.template;
            readonly templateParameters?: typeof htmlOptions.templateParameters;
        } | boolean;
        readonly css?: {
            readonly mode?: "embed-in-js" | "load-from-html";
        };
        readonly customize?: (configuration: Configuration) => Configuration;
    }

    export type ProjectSource = Project | ((mode: "production" | "development") => Project);
}

function WebpackConfig(projectSource: WebpackConfig.ProjectSource): (env: any) => Configuration {
    return env => {
        const mode = env != null && env.production
            ? "production"
            : "development";

        const project = typeof projectSource === "function"
            ? projectSource(mode)
            : projectSource;

        const configDir = module.parent == null
            ? null
            : dirname(module.parent.filename);

        const rootDir = configDir == null
            ? project.rootDir
            : resolve(configDir, project.rootDir || ".");

        if (rootDir == null || !isAbsolute(rootDir)) {
            throw new Error("Could not determine project root path");
        }

        const destDir = project.destDir == null
            ? resolve(rootDir, "dist")
            : resolve(rootDir, project.destDir);

        const vendor = project.vendor == null
            ? "sv"
            : project.vendor;

        const vendorCssId = vendor.replace(/[[\]]/g, "_");

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
                useShortDoctype: true
            }
        };

        if (project.html != null && project.html !== false) {
            if (typeof project.html === "object" && project.html.template != null) {
                htmlOptions.template = project.html.template;
            }

            if (typeof project.html === "object" && project.html.templateParameters != null) {
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

        const extractCss = mode !== "development"
            && (!project.css || project.css.mode == null || project.css.mode === "load-from-html");

        const configuration: Configuration = {
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
                                },
                                transpileOnly: mode === "development"
                            }
                        },
                        exclude: /\/node_modules\//
                    },
                    {
                        test: /\.css$/,
                        use: [
                            extractCss
                                ? MiniCssExtractPlugin.loader
                                : styleLoader,
                            cssLoader,
                            ...mode === "development"
                                ? []
                                : [postcssLoader]
                        ]
                    },
                    {
                        test: /\.less$/,
                        use: [
                            extractCss
                                ? MiniCssExtractPlugin.loader
                                : styleLoader,
                            cssLoader,
                            ...mode === "development"
                                ? []
                                : [postcssLoader],
                            lessLoader
                        ]
                    },
                    {
                        test: /\.(jpe?g|gif|mp[34]|og[agv]|png|svg|web[mp])$/,
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
                extensions: [".js", ".tsx", ".ts"]
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
                    : [new CleanWebpackPlugin()],
                ...extractCss
                    ? [new MiniCssExtractPlugin()]
                    : [],
                ...project.html === false
                    ? []
                    : [new HtmlWebpackPlugin(htmlOptions)]
            ],
            output: {
                path: destDir,
                devtoolModuleFilenameTemplate: "[resource-path]?[loaders]"
            }
        };

        if (project.customize == null) {
            return configuration;
        } else {
            return project.customize(configuration);
        }
    };
}

export = WebpackConfig;

function isAbsolute(dir: string): boolean {
    return normalize(dir + sep) === normalize(resolve(dir) + sep);
}
