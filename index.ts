import {dirname, normalize, resolve, sep} from "path";
import {fold} from "@softwareventures/array";
import {
    dictionary,
    map as dictionaryMap,
    merge as dictionaryMerge
} from "@softwareventures/dictionary";
import {CleanWebpackPlugin} from "clean-webpack-plugin";
import cssnano = require("cssnano");
import HtmlWebpackPlugin = require("html-webpack-plugin");
import type {Object as JsonObject} from "json-typescript";
import MiniCssExtractPlugin = require("mini-css-extract-plugin");
import TerserPlugin = require("terser-webpack-plugin");
import type {Configuration, RuleSetUse} from "webpack";
import {DefinePlugin} from "webpack";
import type {Options as HtmlMinifierOptions} from "html-minifier-terser";
import ResolveTypescriptPlugin from "resolve-typescript-plugin";
import {hasProperty} from "unknown";
import {notNull} from "@softwareventures/nullable";

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
         * the file that called `config()` (usually `webpack.config.cjs`).
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
         * @deprecated Deprecated, use `css: { namespace: "sv" }` instead.
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
                   * The path to the template file must not contain an exclamation mark (`!`).
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

            /** CSS Modules configuration.
             *
             * If set to an object, CSS Modules are enabled. In this case CSS
             * class names are mangled at compile time. This is useful when
             * composing together components which each have their own CSS, to
             * prevent name conflicts between unrelated CSS Modules.
             *
             * If set to `false`, CSS Modules are disabled, and CSS class names
             * are not mangled. This is useful when CSS class names must be
             * maintained as-is at runtime, for example because the class names
             * are referenced from static HTML.
             *
             * By default, CSS modules are enabled.
             *
             * @see https://github.com/css-modules/css-modules
             *
             * @default { namespace: "sv" } */
            readonly modules?:
                | {
                      /** A namespace that is prefixed to all CSS class names, to
                       * further reduce the likelihood of name conflicts.
                       *
                       * Defaults to `"sv"`, for Software Ventures Limited.
                       *
                       * @default "sv" */
                      readonly namespace?: string;
                  }
                | false;
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

// eslint-disable-next-line @typescript-eslint/naming-convention
function WebpackConfig(
    projectSource: WebpackConfig.ProjectSource
): (env: unknown) => Configuration {
    return env => {
        const mode =
            hasProperty(env, "production") && Boolean(env.production)
                ? "production"
                : "development";

        const project =
            typeof projectSource === "function"
                ? projectSource(mode, normalizeEnv(env))
                : projectSource;

        const configDir = module.parent == null ? null : dirname(module.parent.filename);

        const rootDir =
            configDir == null ? project.rootDir : resolve(configDir, project.rootDir ?? ".");

        if (rootDir == null || !isAbsolute(rootDir)) {
            throw new Error("Could not determine project root path");
        }

        const destDir =
            project.destDir == null ? resolve(rootDir, "dist") : resolve(rootDir, project.destDir);

        const cssModules =
            project.css?.modules === false
                ? null
                : project.css?.modules == null
                ? {namespace: project.vendor ?? "sv"}
                : {...project.css.modules, namespace: project.css.modules.namespace ?? "sv"};

        const cssModulesNamespace = cssModules?.namespace ?? null;

        const entry: WebpackConfig.Entry = project.entry ?? "./index.js";

        const define: JsonObject = project.define ?? {};

        const htmlMinifierOptions: HtmlMinifierOptions = {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            decodeEntities: true,
            keepClosingSlash: false,
            minifyCSS: true,
            minifyJS: true,
            removeAttributeQuotes: true,
            removeComments: true,
            removeOptionalTags: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            sortAttributes: true,
            sortClassName: true,
            useShortDoctype: true
        };

        const htmlOptions: HtmlWebpackPlugin.Options = {
            title: project.title,
            inject: "head",
            minify: htmlMinifierOptions
        };

        if (project.html != null && project.html !== false) {
            if (typeof project.html === "object" && project.html.template != null) {
                if (project.html.template.includes("!")) {
                    throw new Error(
                        "Path to HTML template may not contain an exclamation mark (`!`)"
                    );
                }
                htmlOptions.template = `!!${require.resolve("ejs-loader")}?{esModule:false}!${
                    project.html.template
                }`;
            } else {
                htmlOptions.templateContent = (parameters: unknown) =>
                    `<!DOCTYPE html><html><head><title>${String(
                        get(parameters, "htmlWebpackPlugin", "options", "title") ?? ""
                    )}</title></head><body></body></html>`;
            }

            if (typeof project.html === "object" && project.html.templateParameters != null) {
                htmlOptions.templateParameters = project.html.templateParameters;
            }
        }

        const styleLoader: RuleSetUse = {
            loader: require.resolve("style-loader")
        };

        const cssLoader: RuleSetUse = {
            loader: require.resolve("css-loader"),
            options: {
                importLoaders: mode === "development" ? 1 : 0,
                esModule: true,
                modules:
                    cssModulesNamespace == null
                        ? false
                        : {
                              mode: "local",
                              localIdentName:
                                  mode === "development"
                                      ? "[local]-[sha256:contenthash:base64:5]"
                                      : cssModulesNamespace + "[sha256:contenthash:base64:5]",
                              namedExport: false,
                              exportGlobals: true,
                              exportLocalsConvention: "asIs"
                          }
            }
        };

        const postcssLoader: RuleSetUse = {
            loader: require.resolve("postcss-loader"),
            options: {
                postcssOptions: {
                    plugins: [cssnano]
                }
            }
        };

        const lessLoader: RuleSetUse = {
            loader: require.resolve("less-loader"),
            options: {
                lessOptions: {
                    math: "parens-division",
                    strictUnits: true
                }
            }
        };

        const extractCss =
            mode !== "development" &&
            (project.css == null ||
                project.css.mode == null ||
                project.css.mode === "load-from-html");

        const fileLoader = {
            loader: require.resolve("file-loader"),
            options: {
                esModule: false,
                name:
                    mode === "development"
                        ? "[path][name]-[sha256:contenthash:base64:8].[ext]"
                        : "[sha256:contenthash:base64:8].[ext]"
            }
        };

        const configuration: Configuration = {
            mode,
            context: rootDir,
            entry,
            target: ["web", "es2017"],
            module: {
                rules: [
                    {
                        test: /\.tsx?$/iu,
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
                        exclude: /\/node_modules\//u
                    },
                    {
                        test: /\.html?$/iu,
                        use: [
                            fileLoader,
                            require.resolve("extract-loader"),
                            {
                                loader: require.resolve("html-loader"),
                                options: {
                                    minimize: htmlMinifierOptions,
                                    esModule: true
                                }
                            }
                        ],
                        type: "javascript/auto"
                    },
                    {
                        test: /\.css$/iu,
                        use: [
                            extractCss ? MiniCssExtractPlugin.loader : styleLoader,
                            cssLoader,
                            ...(mode === "development" ? [] : [postcssLoader])
                        ],
                        type: "javascript/auto"
                    },
                    {
                        test: /\.less$/iu,
                        use: [
                            extractCss ? MiniCssExtractPlugin.loader : styleLoader,
                            cssLoader,
                            ...(mode === "development" ? [] : [postcssLoader]),
                            lessLoader
                        ],
                        type: "javascript/auto"
                    },
                    {
                        test: /\.(eot|gif|jpe?g|mp[34]|og[agv]|png|svg|ttf|web[mp]|woff2?)$/iu,
                        use: fileLoader,
                        type: "javascript/auto"
                    }
                ]
            },
            resolve: {
                plugins: [new ResolveTypescriptPlugin()]
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
                                  extractComments: /^\**!|@preserve|@license/iu,
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
                                          comments: false
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
            devServer: {
                static: false
            },
            output: {
                path: destDir,
                publicPath: "",
                devtoolModuleFilenameTemplate: "[resource-path]?[loaders]",
                assetModuleFilename:
                    mode === "development"
                        ? "[path][name]-[contenthash].[ext]"
                        : "[contenthash].[ext]",
                hashDigest: "base64url",
                hashDigestLength: 8,
                hashFunction: "sha256"
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

function normalizeEnv(env: unknown): JsonObject {
    if (env instanceof Array) {
        return fold(
            env,
            (accumulator, element) => dictionaryMerge(accumulator, normalizeEnv(element)),
            dictionary()
        );
    } else if (typeof env === "object" && env != null) {
        return env as JsonObject;
    } else {
        return {};
    }
}

function get(object: unknown, ...keys: string[]): unknown {
    let value = object;
    for (let i = 0; value != null && i < keys.length; ++i) {
        const key = notNull(keys[i]);
        value = hasProperty(value, key) ? value[key] : undefined;
    }
    return value;
}
