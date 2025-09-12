const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const packageJson = require('./package.json');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const version = packageJson.version;
  
  return {
    entry: './src/widget.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: `widget-${version}.js`,
      // Expose as global for CDN consumers (script tag)
      library: 'FeedbacksWidget',
      libraryTarget: 'umd',
      libraryExport: 'default', // Export the default export as FeedbacksWidget
      globalObject: 'this',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      ...(isProduction ? [new MiniCssExtractPlugin({
        filename: `widget-${version}.css`
      })] : []),
    ],
    optimization: {
      minimize: isProduction,
      usedExports: true,
    },
    devServer: {
      static: path.join(__dirname, 'dist'),
      port: 3001,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  };
};
