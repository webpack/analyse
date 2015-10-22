var app = require("../../app");
var modulesGraph = require("../../graphs/modules");
var sortTable = require("../../sortTable");

module.exports = function(id) {
	id = parseInt(id, 10);
	document.title = "chunk " + id;
	$(".page").html(require("./chunk.jade")({
		stats: app.stats,
		id: id,
		chunk: app.mapChunks[id],
		mapChunks: app.mapChunks
	}));
	modulesGraph.show();
	modulesGraph.setActiveChunk(id);
	$('#size').click(function(e){
		e.preventDefault();
		sortTable(3);
	});
	$('#recursive-size').click(function(e){
		e.preventDefault();
		sortTable(4);
	});
	return function() {
		modulesGraph.hide();
	}
};