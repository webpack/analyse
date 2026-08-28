var app = require("../../app");
var sortableTable = require("../../sortableTable");

module.exports = function() {
	document.title = "assets";
	sortableTable.enable();
	$(".page").html(
		require("./assets.pug")({
			stats: app.stats
		})
	);
};
