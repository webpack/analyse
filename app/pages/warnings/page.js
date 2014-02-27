var app = require("../../app");

module.exports = function() {
	document.title = "warnings";
	$(".page").html(require("./warnings.jade")({
		stats: app.stats,
		warnings: app.stats.warnings.map(function(str) {
			str = str.split("\n");
			var header = str.shift();
			var footer = str.pop();
			if(!/^ @/.test(footer)) str.push(footer), footer = "";
			return {
				header: header,
				text: str.join("\n"),
				footer: footer
			}
		})
	}));
};