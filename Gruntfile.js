var path = require("path");
module.exports = function(grunt) {
	require("matchdep").filterAll("grunt-*").forEach(grunt.loadNpmTasks);
	var webpack = require("webpack");
	grunt.initConfig({
		webpack: {
			options: require("./webpack.config.js"),
			production: {
				plugins: [
					new webpack.DefinePlugin({
						GA_TRACKING_CODE: JSON.stringify('UA-46921629-1'),
						GA_TRACKING_CONFIG: JSON.stringify('webpack.github.io')
					}),
					new webpack.optimize.OccurenceOrderPlugin(),
					new webpack.optimize.UglifyJsPlugin()
				]
			}
		},
		"webpack-dev-server": {
			development: {
				contentBase: "dist",
				port: 8080,
				keepAlive: true,
				webpack: merge(require("./webpack.config.js"), {
					devtool: "eval"
				})
			}
		},
		"gh-pages": {
			options: {
				message: "Publish",
				base: "dist"
			},
			src: ["**"]
		},
		copy: {
			main: {
				src: "index.html",
				dest: "dist/"
			}
		},
		clean: ["dist"]
	});
	grunt.registerTask("development", ["copy", "webpack-dev-server:development"]);
	grunt.registerTask("production", ["copy", "webpack:production"]);
	grunt.registerTask("deploy", ["clean", "production", "gh-pages"]);

	grunt.registerTask("dev", ["development"]);
	grunt.registerTask("default", ["production"]);
};

function merge(a, b) {
	var o = {};
	for(var key in a) {
		o[key] = a[key];
	}
	for(var key in b) {
		o[key] = b[key];
	}
	return o;
}