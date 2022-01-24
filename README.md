# webpack-config

Simplified and opinionated webpack configuration.

This package implements a standard webpack configuration preferred by Software
Ventures Limited, but can also be used by others.

## Why?

Configuring webpack from scratch is time-consuming and complicated. This package
provides a standard webpack configuration that is suitable for most projects.

## Upgrading from v3 or earlier

See [Upgrade Guide](docs/Upgrade-Guide.md).

## Setup

Add a dependency on this package, webpack, and webpack-dev-server, for example
using npm or yarn:

```
$ npm install --save-dev @softwareventures/webpack-config webpack webpack-cli webpack-dev-server
```

```
$ yarn add --dev @softwareventures/webpack-config webpack webpack-cli webpack-dev-server
```

Create a `webpack.config.cjs` file at the root of your project with the
following contents:

```javascript
const config = require("@softwareventures/webpack-config");

module.exports = config({
    title: "Name of your app"
});
```

webpack-config exports a single function, `config`. Options may be passed to
`config` as an object or as a function that returns an object.

The `config` function itself returns a webpack configuration, which should be
exported by `webpack.config.cjs`.

We also recommend that you add a `build` and `start` script to `package.json`:

```json
{
    "scripts": {
        "build": "webpack --env production",
        "start": "webpack-dev-server --open"
    }
}
```

See [Building](#building) and [Dev Server](#dev-server) for more on these
scripts.

## TypeScript Support

To enable TypeScript, first add dev dependencies on `ts-loader` and
`typescript`, and a dependency on `tslib`:

```
npm install --save-dev ts-loader typescript
npm install --save tslib
```

or

```
yarn add --dev ts-loader typescript
yarn add tslib
```

Then create a `tsconfig.json` file at the root of your project with the
following contents:

```json
{
    "extends": "@softwareventures/webpack-config/tsconfig/general",
    "compilerOptions": {
        "types": [
            "webpack-env",
            "@softwareventures/webpack-config/asset-loaders"
        ]
    }
}
```

webpack-config provides several preset TypeScript configurations for different
purposes, which can be used in place of the above:

-   `@softwareventures/webpack-config/tsconfig/general`: General purpose
    configuration suitable for most projects.
-   `@softwareventures/webpack-config/tsconfig/general-commonjs`: Same as
    `general`, but modules are compiled to CommonJS module format instead of
    ESM. Useful for older projects that are not ready to transition to ESM. Not
    recommended for new projects.
-   `@softwareventures/webpack-config/tconfig/preact`: Configuration suitable
    for projects using JSX with [Preact][1].
-   `@softwareventures/webpack-config/tconfig/preact-commonjs`: Same as
    `preact`, but modules are compiled to CommonJS module format instead of ESM.
    Useful for older projects that are not ready to transition to ESM. Not
    recommended for new projects.
-   `@softwareventures/webpack-config/tsconfig/react`: Configuration suitable
    for projects using JSX with [React][3].
-   `@softwareventures/webpack-config/tsconfig/react-commonjs` Same as `react`,
    but modules are compiled to CommonJS module format instead of ESM. Useful
    for older projects that are not ready to transition to ESM. Not recommended
    for new projects.

Any of these presets can be used as a base with project-specific overrides. Any
options set in `tsconfig.json` will override those set by the preset. See
[tsconfig.json in the TypeScript Handbook][2] for more information on
configuring TypeScript.

## Building

We recommend that you set up a script in `package.json` to build your project,
as follows:

```json
{
    "scripts": {
        "build": "webpack --env production"
    }
}
```

You can then run the build script using npm or yarn:

```bash
npm run build
```

```bash
yarn build
```

Build output goes in `dist` by default.

## Dev Server

We recommend that you set up a script in `package.json` to run the dev server,
as follows:

```json
{
    "scripts": {
        "start": "webpack serve --open"
    }
}
```

You can then run the dev server using npm or yarn:

```bash
npm start
```

```bash
yarn start
```

## See Also

-   [@softwareventures/eslint-config](https://github.com/softwareventures/eslint-config)

[1]: https://preactjs.com/
[2]: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
[3]: https://reactjs.org/
