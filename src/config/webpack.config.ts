/*
 * The webpack config exports an object that has a valid webpack configuration
 * For each environment name. By default, there are two Ionic environments:
 * "dev" and "prod". As such, the webpack.config.js exports a dictionary object
 * with "keys" for "dev" and "prod", where the value is a valid webpack configuration
 * For details on configuring webpack, see their documentation here
 * https://webpack.js.org/configuration/
 */

import type * as webpack from "webpack";
var path = require("path");
var ionicWebpackFactory = require(process.env.IONIC_WEBPACK_FACTORY);
const Dotenv = require("dotenv-webpack");

var PurifyPlugin = require("@angular-devkit/build-optimizer").PurifyPlugin;

const optimizedProdLoaders: webpack.Rule[] = [
  {
    test: /\.json$/,
    use: "json-loader",
  },
  {
    test: /\.js$/,
    // loader: [process.env.IONIC_CACHE_LOADER],
    use: [
      process.env.IONIC_CACHE_LOADER,
      {
        loader: "@angular-devkit/build-optimizer/webpack-loader",
        options: {
          sourceMap: true,
        },
      },
    ],
  },
  {
    test: /\.ts$/,
    use: [
      {
        loader: process.env.IONIC_CACHE_LOADER,
      },
      {
        loader: "@angular-devkit/build-optimizer/webpack-loader",
        options: {
          sourceMap: true,
        },
      },
      {
        loader: process.env.IONIC_WEBPACK_LOADER,
      },
    ],
  },
];
const developementLoaders: webpack.Rule[] = [
  {
    test: /\.json$/,
    use: "json-loader",
  },
  {
    test: /\.ts$/,
    use: process.env.IONIC_WEBPACK_LOADER,
  },
];

function getProdLoaders(): webpack.Rule[] {
  if (process.env.IONIC_OPTIMIZE_JS === "true") {
    return optimizedProdLoaders;
  }
  return developementLoaders;
}

const devConfig: webpack.Configuration = {
  entry: process.env.IONIC_APP_ENTRY_POINT,
  output: {
    path: "{{BUILD}}",
    publicPath: "build/",
    filename: "[name].js",
    devtoolModuleFilenameTemplate: ionicWebpackFactory.getSourceMapperFunction(),
  },
  devtool: process.env.IONIC_SOURCE_MAP_TYPE,

  resolve: {
    extensions: [".ts", ".js", ".json"],
    modules: [path.resolve("node_modules")],
  },

  module: {
    rules: developementLoaders,
  },

  plugins: [
    new Dotenv({
      path: ".env.dev", // load this now instead of the ones in '.env'
      systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
      silent: true, // hide any errors
    }),
    ionicWebpackFactory.getIonicEnvironmentPlugin(),
    ionicWebpackFactory.getCommonChunksPlugin(),
  ],

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    fs: "empty",
    net: "empty",
    tls: "empty",
  },
};

const prodConfig: webpack.Configuration = {
  entry: process.env.IONIC_APP_ENTRY_POINT,
  output: {
    path: "{{BUILD}}",
    publicPath: "build/",
    filename: "[name].js",
    devtoolModuleFilenameTemplate: ionicWebpackFactory.getSourceMapperFunction(),
  },
  devtool: process.env.IONIC_SOURCE_MAP_TYPE,

  resolve: {
    extensions: [".ts", ".js", ".json"],
    modules: [path.resolve("node_modules")],
  },

  module: {
    loaders: getProdLoaders(),
  },

  plugins: [
    new Dotenv({
      path: ".env.prod", // load this now instead of the ones in '.env'
      systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
      silent: true, // hide any errors
    }),
    ionicWebpackFactory.getIonicEnvironmentPlugin(),
    ionicWebpackFactory.getCommonChunksPlugin(),
    new PurifyPlugin(),
  ],

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    fs: "empty",
    net: "empty",
    tls: "empty",
  },
};

export = {
  dev: devConfig,
  prod: prodConfig,
};
