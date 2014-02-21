var app = require("../../app");

module.exports = function() {
	$(".page").html(require("./modules.jade")({
		stats: app.stats
	}));
};