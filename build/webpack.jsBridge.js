const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const isDev = process.env.NODE_ENV === 'dev';

const provides = {
  console: [resolveApp('src/util/console')],
  KipleViewJSBridge: [resolveApp('src/core/webview/bridge/index')],
  KipleServiceJSBridge: [resolveApp('src/core/service/bridge/index')],
};

module.exports = {
  mode: 'production',
  devtool: isDev ? 'source-map' : false,
  entry: {
    jsBridge: resolveApp('src/platforms/app/service/api/index.ts'),
  },
  output: {
    path: resolveApp('dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@': resolveApp('src'),
      'kiple-lib': resolveApp('lib'),
      'kiple-platform': resolveApp(`src/platforms/${process.env.PLATFORM}`),
    },
  },
  module: {
    rules: [
      {
        test: /.ts|js?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [new webpack.ProvidePlugin(provides)],
};
