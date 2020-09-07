import {dirname, normalize, resolve, sep} from "path";
import {fold} from "@softwareventures/array";
import {map as dictionaryMap, merge as dictionaryMerge} from "@softwareventures/dictionary";
import {CleanWebpackPlugin} from "clean-webpack-plugin";
import cssnano = require("cssnano");
import HtmlWebpackPlugin = require("html-webpack-plugin");
import {Object as JsonObject} from "json-typescript";
import MiniCssExtractPlugin = require("mini-css-extract-plugin");
import TerserPlugin = require("terser-webpack-plugin");
import {Configuration, DefinePlugin, RuleSetUse} from "webpack";

// Placeholder variables for type declarations.
let webpackConfiguration: Required<Configuration>;
let htmlOptions: Required<HtmlWebpackPlugin.Options>;

namespace WebpackConfig {
    /** An entry point or entry points as defined by webpack.
     *
     * @see https://webpack.js.org/concepts/entry-points/ */
    export type Entry = typeof webpackConfiguration.entry;

    /** Simplified webpack configuration. */
    export interface Project {
        /** The root directory of the project.
         *
         * The path will be resolved relative to the directory containing
         * the file that called `config()` (usually `webpack.config.js`).
         *
         * @default "." */
        readonly rootDir?: string;

        /** The directory where webpack will write build output.
         *
         * The path will be resolved relative to the resolved root directory
         * (`this.rootDir`).
         *
         * @default "dist"
         */
        readonly destDir?: string;

        /** The title of the project.
         *
         * This value is used as the title of the generated index.html file. */
        readonly title: string;

        /** CSS vendor prefix.
         *
         * This value is prepended to all CSS class names. This is useful if
         * there is third-party code on the same page, to help avoid CSS
         * conflicts.
         *
         * Set to the empty string to disable this feature.
         *
         * @default "sv" */
        readonly vendor?: string;

        /** The entry point or entry points.
         *
         * @see https://webpack.js.org/concepts/entry-points/ */
        readonly entry?: Entry;

        /** A set of static global variables that will be defined for every
         * module.
         *
         * For each key and value, the key specifies the name of the variable
         * and the value specifies the value.
         *
         * @default {} */
        readonly define?: JsonObject;

        /** Configures webpack to generate an index.html file that loads the
         * entry points.
         *
         * To generate an index.html file with the default settings, set this
         * field to `true`.
         *
         * To suppress generation of an index.html file, set this field to
         * `false`.
         *
         * The generate an index.html file with custom settings, set this field
         * to an object that specifies the desired settings.
         *
         * @default true */
        readonly html?:
            | {
                  /** Path to a template file used to generate index.html.
                   *
                   * The path will be resolved relative to the resolved root directory
                   * (`this.rootDir`).
                   *
                   * The template file will be interpreted as a
                   * [Lodash template](https://lodash.com/docs/4.17.15#template).
                   *
                   * @see https://github.com/jantimon/html-webpack-plugin#writing-your-own-templates
                   */
                  readonly template?: typeof htmlOptions.template;

                  /** Additional parameters to pass to the index.html template. */
                  readonly templateParameters?: typeof htmlOptions.templateParameters;
              }
            | boolean;

        /** Options that control how webpack handles CSS. */
        readonly css?: {
            /** Whether to embed CSS in JavaScript, or load it from the
             * generated index.html.
             *
             * When building in development mode, this option is ignored and
             * CSS is always embedded in JavaScript.
             *
             * @default "load-from-html" */
            readonly mode?: "embed-in-js" | "load-from-html";
        };

        /** Callback that provides an opportunity to customize the webpack
         * configuration generated by webpack-config.
         *
         * webpack-config calls this function after it has generated a
         * configuration based on the other settings. The function receives
         * that configuration as an argument. The function may modify the
         * configuration provided. The function must return a webpack
         * configuration, which may either be the original configuration
         * with or without modifications, or a new configuration.
         *
         * The actual webpack configuration used will be the configuration
         * that is returned by this function. */
        readonly customize?: (configuration: Configuration) => Configuration;
    }

    /** A Simplified webpack configuration, or a function that returns a
     * simplified webpack configuration.
     *
     * @param mode The mode the project is being built in, either
     * `"development"` or `"production"`.
     *
     * @param env The [environment](https://webpack.js.org/guides/environment-variables/)
     * that was passed to webpack, for example using `--env` command-line options. */
    export type ProjectSource =
        | Project
        | ((mode: "production" | "development", env: JsonObject) => Project);
}

function WebpackConfig(projectSource: WebpackConfig.ProjectSource): (env: any) => Configuration {
    return env => {
        const mode = env != null && env.production ? "production" : "development";

        const project =
            typeof projectSource === "function"
                ? projectSource(mode, normalizeEnv(env))
                : projectSource;

        const configDir = module.parent == null ? null : dirname(module.parent.filename);

        const rootDir =
            configDir == null ? project.rootDir : resolve(configDir, project.rootDir || ".");

        if (rootDir == null || !isAbsolute(rootDir)) {
            throw new Error("Could not determine project root path");
        }

        const destDir =
            project.destDir == null ? resolve(rootDir, "dist") : resolve(rootDir, project.destDir);

        const vendor = project.vendor == null ? "sv" : project.vendor;

        const vendorCssId = vendor.replace(/[[\]]/g, "_");

        const entry: WebpackConfig.Entry = project.entry == null ? "./index" : project.entry;

        const define: JsonObject = project.define == null ? {} : project.define;

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
                esModule: true,
                modules: {
                    compileType: "module",
                    mode: "local",
                    localIdentName:
                        mode === "development"
                            ? "[local]-[sha256:contenthash:base64:5]"
                            : vendorCssId + "[sha256:contenthash:base64:5]",
                    namedExport: true,
                    exportGlobals: false,
                    exportLocalsConvention: "camelCase"
                }
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

        const extractCss =
            mode !== "development" &&
            (!project.css || project.css.mode == null || project.css.mode === "load-from-html");

        const configuration: Configuration = {
            mode,
            context: rootDir,
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
                            extractCss ? MiniCssExtractPlugin.loader : styleLoader,
                            cssLoader,
                            ...(mode === "development" ? [] : [postcssLoader])
                        ]
                    },
                    {
                        test: /\.less$/,
                        use: [
                            extractCss ? MiniCssExtractPlugin.loader : styleLoader,
                            cssLoader,
                            ...(mode === "development" ? [] : [postcssLoader]),
                            lessLoader
                        ]
                    },
                    {
                        test: /\.(eot|gif|jpe?g|mp[34]|og[agv]|png|svg|ttf|web[mp]|woff2?)$/,
                        use: {
                            loader: "file-loader",
                            options: {
                                esModule: true,
                                name:
                                    mode === "development"
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
            devtool: mode === "development" ? "inline-source-map" : false,
            optimization:
                mode === "development"
                    ? {
                          minimize: false
                      }
                    : {
                          minimize: true,
                          minimizer: [
                              new TerserPlugin({
                                  cache: true,
                                  extractComments: false,
                                  parallel: true,
                                  terserOptions: {
                                      compress: {
                                          passes: 2,
                                          unsafe: true,
                                          unsafe_math: true,
                                          unsafe_proto: true
                                      },
                                      output: {
                                          inline_script: false,
                                          comments: /^\**!|@preserve|@license/i
                                      }
                                  }
                              })
                          ]
                      },
            plugins: [
                ...(mode === "development" ? [] : [new CleanWebpackPlugin()]),
                new DefinePlugin(dictionaryMap(define, value => JSON.stringify(value))),
                ...(extractCss ? [new MiniCssExtractPlugin()] : []),
                ...(project.html === false ? [] : [new HtmlWebpackPlugin(htmlOptions)])
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

function normalizeEnv(env: any): JsonObject {
    if (env instanceof Array) {
        return fold(
            env,
            (accumulator, element) => dictionaryMerge(accumulator, normalizeEnv(element)),
            Object.create(null)
        );
    } else if (typeof env === "object") {
        return env;
    } else {
        return {};
    }
}
