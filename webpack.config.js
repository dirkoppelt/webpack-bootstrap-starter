const path = require('path');
const postCssSafeParser = require('postcss-safe-parser');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');

function root(...args) {
  return path.join.apply(path, [__dirname, ...args]);
}

const modeDevelopment = process.env.NODE_ENV !== 'production';

__webpack_public_path__ = process.env.ASSET_PATH || './';

const plugins = [
  new CleanWebpackPlugin(),
  new webpack.NamedModulesPlugin(),
  new webpack.DefinePlugin({
    // globale js variablen
    PUBLIC_PATH: JSON.stringify(__webpack_public_path__)
  }),
  new MiniCssExtractPlugin({
    filename: "css/[name].css",
  }),
  new HtmlWebpackPlugin({
    template: 'src/index.html',
    filename: 'index.html',
    chunksSortMode: 'dependency',
    title: 'page title'
  }),
  new webpack.NoEmitOnErrorsPlugin(),
  // automatisch browser öffnen (läuft nicht unter wayland/linux)
  new OpenBrowserPlugin({ url: 'http://localhost:3333' })
];

if (modeDevelopment) {
  plugins.unshift(new webpack.HotModuleReplacementPlugin())
}

const config = {
  cache: true,
  devtool: modeDevelopment ? 'inline-source-map' : 'source-map',
  entry: {
    main: './src/js/main.js',
    styles: './src/scss/main.scss',
  },
  resolve: {
    extensions: ['.js', '.json', '.scss'],
  },
  output: {
    path: root('dist'),
    // Base URL der Seite, relativ oder absolut
    // publicPath: __webpack_public_path__,
    filename: 'js/[name].js',
    chunkFilename: '[id].chunk.js',
  },
  devServer: {
    port: 3333,
    contentBase: root('dist'),
    //watchContentBase: true,
    quiet: false,
    progress: true,
    hot: false,
    inline: true,
    stats: {
      colors: true,
      reasons: true,
    },
  },
  plugins,
  module: {
    rules: [
      // JS
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      // SCSS
      {
        test: [/\.scss$/i, /\.css$/],
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              sourceMap: true,
              publicPath: __webpack_public_path__,
              context: './dist',
            }
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              config: {
                path: root('postcss.config.js')
              }
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            }
          }
        ],
      },
      // static files (images, fonts)
      {
        test: /\.(svg|woff|woff2|ttf|eot|ico|png|jpe?g|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              context: 'dist',
              name: 'assets/[name].[ext]',
            }
          }
        ]
      }
    ],
  },
  optimization: {
    minimize: !modeDevelopment,
    minimizer: [
      // This is only used in production mode
      new TerserPlugin({
        terserOptions: {
          parse: {
            // we want terser to parse ecma 8 code. However, we don't want it
            // to apply any minfication steps that turns valid ecma 5 code
            // into invalid ecma 5 code. This is why the 'compress' and 'output'
            // sections only apply transformations that are ecma 5 safe
            // https://github.com/facebook/create-react-app/pull/4234
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            // Disabled because of an issue with Uglify breaking seemingly valid code:
            // https://github.com/facebook/create-react-app/issues/2376
            // Pending further investigation:
            // https://github.com/mishoo/UglifyJS2/issues/2011
            comparisons: false,
            // Disabled because of an issue with Terser breaking valid code:
            // https://github.com/facebook/create-react-app/issues/5250
            // Pending futher investigation:
            // https://github.com/terser-js/terser/issues/120
            inline: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            // Turned on because emoji and regex is not minified properly using default
            // https://github.com/facebook/create-react-app/issues/2488
            ascii_only: true,
          },
        },
        // Use multi-process parallel running to improve the build speed
        // Default number of concurrent runs: os.cpus().length - 1
        parallel: true,
        // Enable file caching
        cache: true,
        sourceMap: true,
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          parser: postCssSafeParser,
          map: true,
        },
      }),
    ],
  }
};

module.exports = config;
