var app = require("../../app");
var modulesGraph = require("../../graphs/modules");

module.exports = function() {
	document.title = "modules";
	$(".page").html(require("./modules.jade")({
		stats: app.stats
	}));
	modulesGraph.show();
	modulesGraph.setNormal();
	return function() {
		modulesGraph.hide();
	}
};