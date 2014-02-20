var app = require("../../app");
var sigma = require("sigma.js");
console.log(sigma);

module.exports = function() {
	$(".page").html(require("./modules.jade")({
		stats: app.stats
	}));
};