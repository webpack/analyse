var app = require("../../app");

module.exports = function() {
	$(".page").html(require("./errors.jade")({
		stats: app.stats,
		errors: app.stats.errors.map(function(str) {
			str = str.split("\n");
			var header = str.shift();
			var footer = str.pop();
			return {
				header: header,
				text: str.join("\n"),
				footer: footer
			}
		})
	}));
};