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