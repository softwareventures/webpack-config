import CleanWebpackPlugin = require("clean-webpack-plugin");
import HtmlWebpackPlugin = require("html-webpack-plugin");
import {dirname, normalize, resolve, sep} from "path";
import {Configuration} from "webpack";

let placeholder: Required<Configuration>; // tslint:disable-line:prefer-const

namespace WebpackConfig { // tslint:disable-line:no-namespace
    export type Entry = typeof placeholder.entry;

    export interface Project {
        rootDir?: string;
        destDir?: string;
        title: string;
        entry?: Entry;
    }
}

function WebpackConfig(project: Readonly<WebpackConfig.Project>): (env: any) => Configuration {
    return env => env != null && env.production
        ? production(project)
        : development(project);
}

export = WebpackConfig;

function production(project: Readonly<WebpackConfig.Project>): Configuration {
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
        ? resolve(rootDir, "dest")
        : resolve(rootDir, project.destDir);

    const entry: WebpackConfig.Entry = project.entry == null
        ? "./index"
        : project.entry;

    return {
        mode: "production",
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
                }
            ]
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"]
        },
        plugins: [
            new CleanWebpackPlugin(destDir, {root: rootDir}),
            new HtmlWebpackPlugin({
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
            })
        ],
        output: {
            filename: "index.js",
            path: destDir
        }
    };
}

function development(project: Readonly<WebpackConfig.Project>): Configuration {
    const config = production(project);

    return {
        ...config,
        mode: "development",
        devtool: "inline-source-map",
        output: {
            ...config.output,
            devtoolModuleFilenameTemplate: "[resource-path]?[loaders]"
        }
    };
}

function isAbsolute(dir: string): boolean {
    return normalize(dir + sep) === normalize(resolve(dir) + sep);
}
