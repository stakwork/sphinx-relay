// webpack.config.js for Babel 6
var path = require('path');
var webpack = require('webpack');
require("babel-polyfill");

module.exports = {
  entry: ["babel-polyfill", './frontend/index.jsx'],
  output: { path: __dirname + '/public/js', filename: 'app.js' },
  module: {
    rules: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        loader: 'css-loader',
      }
    ],
  },
  optimization: {
		minimize: false
	},
};
