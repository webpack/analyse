var path = require("path");
module.exports = {
	cache: true,
	entry: "./app/entry.js",
	output: {
		path: path.join(__dirname, "dist"),
		publicPath: "",
		filename: "web.js",
		chunkFilename: "[id].[hash].js",
		jsonpCallback: "a"
	},
	module: {
		noParse: /sigma\.min\.js/,
		loaders: [
			{ test: /\.json$/, loader: "json-loader" },
			{ test: /\.jade$/, loader: "jade-loader" },
			{ test: /\.css$/,  loader: "style-loader!css-loader" },
			{ test: /\.png$/,  loader: "url-loader?limit=5000&minetype=image/png" }
		]
	},
  node: {
    fs: "empty"
  }
};
