var path = require("path");
var webpack = require("webpack");
var HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = ({ googleAnalytics, longTermCaching } = {}) => ({
	entry: {
		web: "./app/entry.js"
	},
	cache: {
		type: "filesystem",
		buildDependencies: {
			config: [__filename]
		}
	},
	resolve: {
		modules: [path.resolve(__dirname, "web_modules"), "node_modules"]
	},
	output: {
		publicPath: "",
		filename: "[name].js",
		chunkFilename: longTermCaching ? "[contenthash].js" : undefined
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				include: path.resolve(__dirname, "node_modules/sigma"),
				loader: "imports-loader",
				options: { this: ">window" }
			},
			{ test: /\.pug$/, use: "pug-loader" },
			{ test: /\.css$/, use: ["style-loader", "css-loader"] },
			{ test: /\.png$/, type: "asset" }
		]
	},
	plugins: [
		compiler => {
			// Hack to make html-webpack-plugin work
			compiler.hooks.thisCompilation.tap("webpack.config.js", compilation => {
				compilation.fileTimestamps = new Map();
			});
		},
		new HtmlWebpackPlugin({
			template: "./app/index.html"
		}),
		googleAnalytics &&
			new webpack.DefinePlugin({
				GA_TRACKING_CODE: JSON.stringify("UA-46921629-1"),
				GA_TRACKING_CONFIG: JSON.stringify("webpack.github.io")
			})
	].filter(Boolean)
});
