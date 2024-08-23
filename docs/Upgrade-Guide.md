# Upgrading to webpack-config v4

-   Ensure webpack is at least v5.
-   Ensure webpack-cli is at least v4.
-   Replace `webpack --env.production` with `webpack --env production`.
-   Replace `webpack-dev-server --open` with `webpack serve --open`.
-   Migrate to ESM (preferred), or use a "-commonjs" config to continue using
    CommonJS.

# Migrating to ESM

-   Set `type: "module"` in package.json
-   Rename `webpack.config.js` to `webpack.config.cjs`
-   Change all `import ... from "foo"` to `foo.js` (even if the source file is
    `.ts` or `.tsx`).
-   Change all `import foo = require("foo")` to `import foo from "foo.js"` (even
    if the source file is `.ts` or `.tsx`).
-   Migrate AVA to ESM if required (see
    https://github.com/avajs/ava/blob/main/docs/recipes/typescript.md#for-packages-with-type-module)
-   See https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
    for further advice on ESM migration.
