import CleanWebpackPlugin = require("clean-webpack-plugin");
import {resolve} from "path";
import {Configuration} from "webpack";

let placeholder: Required<Configuration>; // tslint:disable-line:prefer-const

export type Entry = typeof placeholder.entry;

export interface Project {
    dir: string;
    destDir?: string;
    entry?: Entry;
}

export function production(project: Readonly<Project>): Configuration {
    const destDir = project.destDir == null
        ? resolve(project.dir, "dest")
        : resolve(project.dir, project.destDir);

    const entry: Entry = project.entry == null
        ? "./index.js"
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
            new CleanWebpackPlugin(destDir)
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