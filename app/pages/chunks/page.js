var app = require("../../app");
var chunksGraph = require("../../graphs/chunks");
var sortableTable = require("../../sortableTable");

module.exports = function() {
	document.title = "chunks";
	sortableTable.enable();
	$(".page").html(
		require("./chunks.pug")({
			stats: app.stats
		})
	);
	chunksGraph.show();
	return function() {
		chunksGraph.hide();
	};
};
