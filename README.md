# webpack-config

Simplified and opinionated webpack configuration.

This package implements a standard webpack configuration preferred by
Software Ventures Limited, but can also be used by others.


## Why?

Configuring webpack from scratch is time consuming and complicated. This
package provides a set of standard webpack configurations that are
suitable for most projects.


## Install

```
$ npm install --save-dev @softwareventures/webpack-config webpack webpack-dev-server
```

or

```
$ yarn add --dev @softwareventures/webpack-config webpack webpack-dev-server
```


## Quick Start

webpack.config.js:
```javascript
const config = require("@softwareventures/webpack-config");

module.exports = config({
    title: "Name of your app"
});
```

tsconfig.json (if using TypeScript):
```json
{
  "extends": "@softwareventures/webpack-config/tsconfig/general"
}
```

package.json (recommended):
```json
{
  "scripts": {
    "build": "webpack --env.production",
    "start": "webpack-dev-server --open"
  }
}
```


## See Also

 * [@softwareventures/tslint-rules](https://github.com/softwareventures/tslint-rules)