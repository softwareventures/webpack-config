import {Configuration} from "webpack";

export function production(destDir: string): Configuration {
    return {
        mode: "production",
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
        output: {
            filename: "index.js",
            path: destDir
        }
    };
}

export function development(destDir: string): Configuration {
    const config = production(destDir);

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