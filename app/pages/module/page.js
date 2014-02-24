var app = require("../../app");
var modulesGraph = require("../../graphs/modules");

module.exports = function(id) {
	id = parseInt(id, 10);
	var m = app.mapModulesUid[id];
	$(".page").html(require("./module.jade")({
		stats: app.stats,
		id: id,
		module: m,
		issuer: app.mapModulesUid[m.issuerUid]
	}));
	modulesGraph.show();
	modulesGraph.setActiveModule(id);
	return function() {
		modulesGraph.hide();
	}
};