var app = require("../../app");

module.exports = function() {
	$(".page").html(require("./assets.jade")({
		stats: app.stats
	}));
};