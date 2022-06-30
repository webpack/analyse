const path = require("path");
const webpack = require("webpack");
const PugPlugin = require("pug-plugin");

module.exports = ({ googleAnalytics, longTermCaching } = {}, { mode } = { mode: "production"}) => ({
	mode,
	devtool: 'source-map',

	entry: {
		// The Pug file is the Entrypoint for the source scripts and styles.
		index: "app/pages/index.pug",
	},

	cache: {
		type: "filesystem",
		buildDependencies: {
			config: [__filename]
		}
	},

	resolve: {
		alias: {
			App: path.join(__dirname, 'app/'),
			Views: path.join(__dirname, 'app/pages/'),
			Styles: path.join(__dirname, 'assets/styles/'),
			Images: path.join(__dirname, 'assets/images/'),
		},
		modules: [path.resolve(__dirname, "web_modules"), "node_modules"]
	},

	output: {
		path: path.join(__dirname, 'dist'),
		publicPath: "",
		filename: "assets/js/[name].[contenthash:8].js",
		chunkFilename: longTermCaching ? "assets/js/[id].[contenthash:8].js" : undefined
	},

	module: {
		rules: [
			{ 
				test: /\.pug$/,
				loader: PugPlugin.loader,
			},
			{ 
				test: /\.css$/,
				use: ["css-loader"],
			},
			{ 
				test: /\.png$/,
				type: "asset/resource",
				generator: {
					// output filename of images
					filename: 'assets/img/[name].[hash:8][ext]',
				},
			}
		]
	},

	plugins: [
		// enable to use Pug files as the Entrypoint for scripts and styles
		new PugPlugin({
			modules: [
				// extract CSS from source styles specified directly in Pug
				PugPlugin.extractCss({
					// output filename of styles
					filename: 'assets/css/[name].[contenthash:8].css',
				}),
			],
		}),
		googleAnalytics &&
			new webpack.DefinePlugin({
				GA_TRACKING_CODE: JSON.stringify("UA-46921629-1"),
				GA_TRACKING_CONFIG: JSON.stringify("webpack.github.io")
			})
	].filter(Boolean),

	devServer: {
		static: {
		  directory: path.join(__dirname, 'dist'),
		},
		compress: true,
		watchFiles: {
		  paths: ['app/**/*.*'],
		  options: {
			usePolling: true,
		  },
		},
	  },
});
