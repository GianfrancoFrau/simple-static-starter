const Path = require('path');
const Webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const debug = process.env.DEBUG;
const mode = process.env.BUILD_TARGET || 'development';
const prod = mode === 'production';
const dev = mode === 'development';

const config = {
  mode: mode,
  entry: {
    app: Path.resolve(__dirname, 'src/ts/index.ts'),
  },
  output: {
    path: Path.join(__dirname, 'dist'),
    filename: 'js/[name].js',
    clean: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: false,
    },
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: Path.resolve(__dirname, 'public'), to: 'public' }],
    }),
    new HtmlWebpackPlugin({
      template: Path.resolve(__dirname, 'src/index.html'),
    }),
    new Webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(mode),
    }),
  ],
  resolve: {
    alias: {
      '~': Path.resolve(__dirname, 'src'),
    },
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        enforce: 'pre',
        exclude: /node_modules/,
        loader: 'tslint-loader',
      },
      {
        test: /\.(js)$/,
        enforce: 'pre',
        include: Path.resolve(__dirname, 'src'),
        loader: 'eslint-loader',
        options: {
          emitWarning: true,
        },
      },
      {
        test: /\.tsx?$/,
        use: ['babel-loader', 'ts-loader'],
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
          },
        },
      },
    ],
  },
};

if (dev) {
  config.devtool = 'source-map';
  config.devServer = {
    port: 4200,
  };
  config.module.rules.push({
    test: /\.s?css$/i,
    use: ['style-loader', 'css-loader', 'sass-loader'],
  });
} else if (prod) {
  config.stats = 'errors-only';
  config.bail = true;
  config.module.rules.push({
    test: /\.s?css/i,
    use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
  });
  config.output.filename = 'js/[name].[chunkhash:8].js';
  config.output.chunkFilename = 'js/[name].[chunkhash:8].chunk.js';
  config.optimization.minimize = true;
  config.optimization.minimizer = [
    new TerserPlugin({
      parallel: true,
    }),
  ];
  config.plugins.push(new Webpack.optimize.ModuleConcatenationPlugin());
  config.plugins.push(
    new MiniCssExtractPlugin({
      filename: 'styles/bundle.[hash].css',
    }),
  );
}

if (debug) {
  console.log('Running in debug mode.\n\n', JSON.stringify(config, null, 2));
}

module.exports = config;
