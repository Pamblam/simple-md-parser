const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
	devtool: 'source-map',
	mode: "production", // "production" or "development"
	entry: {
		"simple-md-parser": path.resolve(__dirname, 'src', 'simple-md-parser.js'),
		"simple-md-parser.min": path.resolve(__dirname, 'src', 'simple-md-parser.js'),
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: "[name].js",
		globalObject: 'this',
		library: {
			name: 'simpleMDParser',
			type: 'umd',
		},
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				include: /\.min\.js/,
				extractComments: false,
			}),
		],
	} 
};