var app = require("../../app");

module.exports = function() {
	document.title = "assets";
	$(".page").html(
		require("./assets.pug")({
			stats: app.stats
		})
	);
};
