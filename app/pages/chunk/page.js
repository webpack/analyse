var app = require("../../app");
var modulesGraph = require("../../graphs").modules;
var sortableTable = require("../../sortableTable");

module.exports = function (id) {
	id = isNaN(parseInt(id, 10)) ? decodeURIComponent(id) : parseInt(id, 10);
	document.title = "chunk " + id;
	sortableTable.enable();
	// The module table links to every chunk a module names, and those ids can
	// point at chunks a stats file leaves out (webpack/analyse#34).
	var chunk = app.mapChunks[id];
	$(".page").html(
		chunk
			? require("./chunk.pug")({ stats: app.stats, id: id, chunk: chunk })
			: require("./missing.pug")({ id: id })
	);
	modulesGraph.show();
	if (chunk) modulesGraph.setActiveChunk(id);
	else modulesGraph.setNormal();
	return function () {
		modulesGraph.hide();
	};
};
