const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/widget.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'widget-1.0.0.js',
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
      ...(isProduction ? [new MiniCssExtractPlugin()] : []),
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