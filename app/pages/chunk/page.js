var app = require("../../app");
var modulesGraph = require("../../graphs").modules;
var sortableTable = require("../../sortableTable");

module.exports = function (id) {
	id = isNaN(parseInt(id, 10)) ? decodeURIComponent(id) : parseInt(id, 10);
	document.title = "chunk " + id;
	sortableTable.enable();
	$(".page").html(
		require("./chunk.pug")({
			stats: app.stats,
			id: id,
			chunk: app.mapChunks[id],
		})
	);
	modulesGraph.show();
	modulesGraph.setActiveChunk(id);
	return function () {
		modulesGraph.hide();
	};
};
