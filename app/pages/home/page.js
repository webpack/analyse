var app = require("../../app");

module.exports = function() {
	$(".page").html(require("./home.jade")({
		stats: app.stats
	}));
};