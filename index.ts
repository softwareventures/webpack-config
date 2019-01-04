import CleanWebpackPlugin = require("clean-webpack-plugin");
import HtmlWebpackPlugin = require("html-webpack-plugin");
import {dirname, normalize, resolve, sep} from "path";
import {Configuration} from "webpack";

let placeholder: Required<Configuration>; // tslint:disable-line:prefer-const

export type Entry = typeof placeholder.entry;

export interface Project {
    dir?: string;
    destDir?: string;
    title: string;
    entry?: Entry;
}

export function production(project: Readonly<Project>): Configuration {
    const dir = project.dir == null && module.parent != null
        ? dirname(module.parent.filename)
        : project.dir;

    if (dir == null) {
        throw new Error("Could not determine project root path");
    }

    if (!isAbsolute(dir)) {
        throw new Error("Project root path must be absolute");
    }

    const destDir = project.destDir == null
        ? resolve(dir, "dest")
        : resolve(dir, project.destDir);

    const entry: Entry = project.entry == null
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
            new CleanWebpackPlugin(destDir, {root: dir}),
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

export function development(project: Readonly<Project>): Configuration {
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
