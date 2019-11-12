# webpack-config

Simplified and opinionated webpack configuration.

This package implements a standard webpack configuration preferred by
Software Ventures Limited, but can also be used by others.


## Why?

Configuring webpack from scratch is time consuming and complicated. This
package provides a standard webpack configuration that is suitable for most
projects.


## Setup

Add a dependency on this package, webpack, and webpack-dev-server, for example
using npm or yarn:

```
$ npm install --save-dev @softwareventures/webpack-config webpack webpack-dev-server
```
```
$ yarn add --dev @softwareventures/webpack-config webpack webpack-dev-server
```

Create a `webpack.config.js` file at the root of your project with the
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
exported by `webpack.config.js`.

We also recommend that you add a `build` and `start` script to `package.json`:

```json
{
  "scripts": {
    "build": "webpack --env.production",
    "start": "webpack-dev-server --open"
  }
}
```


## TypeScript Support

webpack-config supports TypeScript out of the box. To enable TypeScript,
create a `tsconfig.json` file to the root of your project with the following
contents:

```json
{
  "extends": "@softwareventures/webpack-config/tsconfig/general"
}
```


## See Also

 * [@softwareventures/tslint-rules](https://github.com/softwareventures/tslint-rules)