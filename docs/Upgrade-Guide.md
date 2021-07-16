# Upgrading to webpack-config v4

 * Ensure webpack is at least v5.
 * Ensure webpack-cli is at least v4.
 * Replace `webpack --env.production` with `webpack --env production`.  
 * Replace `webpack-dev-server --open` with `webpack serve --open`.
 * Migrate to ESM (preferred), or use a "-commonjs" config to continue using CommonJS.

# Migrating to ESM

 * Set `type: "module"` in package.json
 * Rename `webpack.config.js` to `webpack.config.cjs`
 * Change all `import ... from "foo"` to `foo.js` (even if the source file is `.ts` or `.tsx`).
 * Change all `import foo = require("foo")` to `import foo from "foo"`.
 * Migrate AVA to ESM if required. (See Sindre's doc).