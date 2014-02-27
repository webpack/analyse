var app = require("../../app");

module.exports = function() {
	document.title = "errors";
	$(".page").html(require("./errors.jade")({
		stats: app.stats,
		errors: app.stats.errors.map(function(str) {
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