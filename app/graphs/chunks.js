var app = require("../app");
var Graph = require("graphology");
var Sigma = require("sigma").Sigma;
var EdgeArrowProgram = require("sigma/rendering").EdgeArrowProgram;
var FA2Layout = require("graphology-layout-forceatlas2/worker");
var forceAtlas2 = require("graphology-layout-forceatlas2");
var rescale = require("./rescale");
var percentageToColor = require("../percentageToColor").greenRed;

var element = document.getElementById("sigma-chunks");

var nodes = [];
var edges = [];
var chunkCount = app.stats.chunks.length;
var maxSize = 0;
app.stats.chunks.forEach(function (chunk, idx) {
	if (chunk.size > maxSize) maxSize = chunk.size;
});
app.stats.chunks.forEach(function (chunk, idx) {
	var color = percentageToColor(
		Math.pow((chunk.size + 1) / (maxSize + 1), 1 / 4)
	);
	nodes.push({
		id: "chunk" + chunk.id,
		chunkId: chunk.id,
		size: Math.ceil(Math.sqrt(chunk.size + 1)),
		type: "webpack",
		shortLabel: "" + chunk.id,
		label:
			"[" +
			chunk.id +
			"] " +
			chunk.origins
				.map(function (o) {
					return (o.reasons || [])
						.concat(o.name)
						.concat(o.moduleName)
						.join(" ");
				})
				.join(", "),
		x: Math.cos((idx / chunkCount) * Math.PI * 2) * chunkCount,
		y: Math.sin((idx / chunkCount) * Math.PI * 2) * chunkCount,
		color: color,
	});
});
app.stats.chunks.forEach(function (chunk) {
	chunk.parents.forEach(function (parent) {
		edges.push({
			id: "edge" + chunk.id + "-" + parent,
			source: "chunk" + parent,
			target: "chunk" + chunk.id,
			arrow: "target",
			type: "arrow",
			size: chunk.parents.length,
		});
	});
});
// sigma 3 renders a graphology graph rather than a plain {nodes, edges} literal.
var graph = new Graph({ type: "directed", multi: true });

// Reproduces sigma 1's minNodeSize/maxNodeSize 4..20 and minEdgeSize/maxEdgeSize
// 1..3 rescaling, which sigma 3 no longer performs.
var nodeSize = rescale(
	nodes.map(function(node) {
		return node.size;
	}),
	4,
	20
);
var edgeSize = rescale(
	edges.map(function(edge) {
		return edge.size;
	}),
	1,
	3
);

nodes.forEach(function(node) {
	graph.mergeNode(node.id, {
		x: node.x,
		y: node.y,
		size: nodeSize(node.size),
		color: node.color,
		originalColor: node.color,
		label: node.shortLabel,
		fullLabel: node.label,
		chunkId: node.chunkId
	});
});

edges.forEach(function(edge) {
	// A chunk can list the same parent more than once; merge rather than add so
	// a repeated key does not throw.
	graph.mergeEdgeWithKey(edge.id, edge.source, edge.target, {
		size: edgeSize(edge.size)
	});
});

var s = new Sigma(graph, element, {
	// The graph container is display:none until show() runs, and sigma 3 throws
	// on a zero-width container where sigma 1 tolerated it. show() calls resize()
	// once the element is visible, so the initial invalid size is expected.
	allowInvalidContainer: true,
	defaultEdgeType: "arrow",
	edgeProgramClasses: { arrow: EdgeArrowProgram },
	renderEdgeLabels: false,
	nodeReducer: function(node, data) {
		var display = Object.assign({}, data);
		if (data.highlighted) display.label = data.fullLabel;
		return display;
	},
	edgeReducer: function(edge, data) {
		var display = Object.assign({}, data);
		// sigma 1's `edgeColor: "target"`: these edges carry no explicit colour,
		// so they take the colour of their target node.
		if (!display.color)
			display.color = graph.getNodeAttribute(graph.target(edge), "color");
		return display;
	}
});

var layout = new FA2Layout(graph, {
	settings: forceAtlas2.inferSettings(graph)
});

s.on("clickNode", function(e) {
	window.location.hash =
		"#chunk/" + encodeURIComponent(graph.getNodeAttribute(e.node, "chunkId"));
});

exports.show = function() {
	element.style.display = "block";
	// Zero-sized while hidden, so re-measure before refreshing.
	s.resize();
	s.refresh();
	layout.start();
};

exports.hide = function() {
	element.style.display = "none";
	layout.stop();
};
