import {Configuration} from "webpack";

export function production(destDir: string): Configuration {
    return {
        mode: "production",
        output: {
            path: destDir,
            filename: "index.js"
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