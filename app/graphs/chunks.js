var app = require("../app");
var sigma = require("sigma.js");
var findById = require("../findById");
var percentageToColor = require("../percentageToColor").greenRed;

var element = document.getElementById("sigma-chunks");

var nodes = [];
var edges = [];
var chunkCount = app.stats.chunks.length;
var maxSize = 0;
app.stats.chunks.forEach(function(chunk, idx) {
	if(chunk.size > maxSize) maxSize = chunk.size;
});
app.stats.chunks.forEach(function(chunk) {
	var color = percentageToColor(Math.pow((chunk.size+1) / (maxSize+1), 1/4));
	nodes.push({
		id: "chunk" + chunk.id,
		chunkId: chunk.id,
		size: Math.sqrt(chunk.size),
		label: "" + chunk.id,
		x: chunk.id * 10,
		y: Math.abs(chunkCount / 2 - chunk.id),
		color: color
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
	container: "sigma-chunks",
	settings: {
		edgeColor: "target",
		maxNodeSize: 20,
		minNodeSize: 4,
		maxEdgeSize: 3,
		minEdgeSize: 1
	}
});
s.bind("clickNode", function(e) {
	window.location.hash = "#chunk/" + e.data.node.chunkId;
});


s.refresh();

exports.show = function() {
	element.style.display = "block";
	s.refresh();
	s.startForceAtlas2();
	s.renderers[0].resize();
};

exports.hide = function() {
	element.style.display = "none";
	s.stopForceAtlas2();
};
