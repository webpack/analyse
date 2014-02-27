var app = require("../../app");

module.exports = function() {
	document.title = "home";
	$(".page").html(require("./home.jade")({
		stats: app.stats
	}));
};