var app = require("../../app");

module.exports = function() {
	$(".page").html(require("./warnings.jade")({
		stats: app.stats,
		warnings: app.stats.warnings.map(function(str) {
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