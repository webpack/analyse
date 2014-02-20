var app = require("../../app");

module.exports = function() {
	$(".page").html(require("./chunks.jade")({
		stats: app.stats
	}));
};