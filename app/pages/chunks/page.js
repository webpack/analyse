var app = require("../../app");
var sigma = require("sigma.js");

module.exports = function() {
	$(".page").html(require("./chunks.jade")({
		stats: app.stats
	}));
	process.nextTick(function() {
		var nodes = [];
		var edges = [];
		app.stats.chunks.forEach(function(chunk) {
			nodes.push({
				id: "chunk" + chunk.id,
				size: 3,
				label: "" + chunk.id,
				x: chunk.id * 10,
				y: Math.sqrt(chunk.id)
			});
			chunk.parents.forEach(function(parent) {
				edges.push({
					id: "edge" + chunk.id + "-" + parent,
					source: "chunk" + parent,
					target: "chunk" + chunk.id,
					arrow: "target"
				});
			});
		});
		var s = new sigma({
			graph: {
				nodes: nodes,
				edges: edges
			},
			renderer: {
				container: document.getElementById("sigma"),
				type: "canvas"
			},
			settings: {
				defaultEdgeType: "curve",
				defaultEdgeArrow: "target"
			}
		});
		s.startForceAtlas2();
	});
};