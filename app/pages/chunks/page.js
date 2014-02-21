var app = require("../../app");
var sigma = require("sigma.js");
var percentageToColor = require("../../percentageToColor");

module.exports = function() {
	$(".page").html(require("./chunks.jade")({
		stats: app.stats
	}));
	process.nextTick(function() {
		var nodes = [];
		var edges = [];
		var chunkCount = app.stats.chunks.length;
		app.stats.chunks.forEach(function(chunk) {
			nodes.push({
				id: "chunk" + chunk.id,
				size: Math.sqrt(chunk.size),
				label: "" + chunk.id,
				x: chunk.id * 10,
				y: Math.abs(chunkCount / 2 - chunk.id),
				color: percentageToColor((chunk.id + 1) / (chunkCount + 1))
			});
		});
		app.stats.chunks.forEach(function(chunk) {
			chunk.parents.forEach(function(parent) {
				edges.push({
					id: "edge" + chunk.id + "-" + parent,
					source: "chunk" + parent,
					target: "chunk" + chunk.id,
					arrow: "target",
					type: "arrow",
					size: chunk.parents.length
				});
			});
		});
		var s = new sigma({
			graph: {
				nodes: nodes,
				edges: edges
			},
			container: "sigma",
			settings: {
				edgeColor: "target",
				maxNodeSize: 20,
				minNodeSize: 4,
				maxEdgeSize: 3,
				minEdgeSize: 1
			}
		});
		s.startForceAtlas2();
	});
};