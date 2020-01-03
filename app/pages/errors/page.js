var app = require("../../app");
var normalize = require("./normalize");

module.exports = function() {
	document.title = "errors";
	$(".page").html(
		require("./errors.pug")({
			stats: app.stats,
			errors: app.stats.errors.map(normalize)
		})
	);
};
