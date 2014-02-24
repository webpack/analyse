var app = require("../../app");
var modulesGraph = require("../../graphs/modules");

module.exports = function(id) {
	id = parseInt(id, 10);
	$(".page").html(require("./chunk.jade")({
		stats: app.stats,
		id: id,
		chunk: app.mapChunks[id]
	}));
	modulesGraph.show();
	modulesGraph.setActiveChunk(id);
	return function() {
		modulesGraph.hide();
	}
};