declare module "*.css" {
    const mappings: {readonly [key: string]: string};
    export default mappings;
}

declare module "*.less" {
    const mappings: {readonly [key: string]: string};
    export default mappings;
}

declare module "*.jpeg" {
    const url: string;
    export = url;
}

declare module "*.jpg" {
    const url: string;
    export = url;
}

declare module "*.gif" {
    const url: string;
    export = url;
}

declare module "*.mp3" {
    const url: string;
    export = url;
}

declare module "*.mp4" {
    const url: string;
    export = url;
}

declare module "*.oga" {
    const url: string;
    export = url;
}

declare module "*.ogg" {
    const url: string;
    export = url;
}

declare module "*.ogv" {
    const url: string;
    export = url;
}

declare module "*.png" {
    const url: string;
    export = url;
}

declare module "*.svg" {
    const url: string;
    export = url;
}

declare module "*.webm" {
    const url: string;
    export = url;
}

declare module "*.webp" {
    const url: string;
    export = url;
}

declare module "*.html" {
    const url: string;
    export = url;
}

declare module "*.htm" {
    const url: string;
    export = url;
}

declare namespace NodeJS {
    interface Process {
        readonly env: {
            readonly [key: string]: unknown;
            readonly NODE_ENV: string;
        };
    }
}
