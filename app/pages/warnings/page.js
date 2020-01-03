var app = require("../../app");
var normalize = require("../errors/normalize");

module.exports = function() {
	document.title = "warnings";
	$(".page").html(
		require("./warnings.pug")({
			stats: app.stats,
			warnings: app.stats.warnings.map(normalize)
		})
	);
};
