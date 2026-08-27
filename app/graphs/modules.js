var app = require("../app");
var Graph = require("graphology");
var Sigma = require("sigma").Sigma;
var EdgeArrowProgram = require("sigma/rendering").EdgeArrowProgram;
var FA2Layout = require("graphology-layout-forceatlas2/worker");
var forceAtlas2 = require("graphology-layout-forceatlas2");
var rescale = require("./rescale");
var percentageToColor = require("../percentageToColor").greenRed;
var percentageToColor2 = require("../percentageToColor").blue;

var element = document.getElementById("sigma-modules");

var nodes = [];
var edges = [];
var moduleCount = app.stats.modules.length;
var chunkCount = app.stats.chunks.length;
var maxTimestamp = 0;
var maxSize = 0;
app.stats.modules.forEach(function(module, idx) {
	if (module.size > maxSize) maxSize = module.size;
	if (module.timestamp > maxTimestamp) maxTimestamp = module.timestamp;
});
app.stats.modules.forEach(function(module, idx) {
	var color = percentageToColor(
		Math.pow((module.size + 1) / (maxSize + 1), 1 / 4)
	);
	var done = {};
	var uniqueReasons = module.reasons.filter(function(reason) {
		var parent = reason.module;
		if (done["$" + parent]) return false;
		done["$" + parent] = true;
		return true;
	});
	var uid = module.uid;
	nodes.push({
		id: "module" + uid,
		uid: uid,
		moduleUid: uid,
		moduleId: module.id,
		module: module,
		type: "webpack",
		size: module.size + 1,
		label: "[" + module.id + "] " + module.name,
		shortLabel: "" + module.id,
		x:
			Math.cos((idx / moduleCount) * Math.PI * 2) *
			Math.sqrt(uniqueReasons.length + 1) *
			Math.sqrt(moduleCount),
		y:
			Math.sin((idx / moduleCount) * Math.PI * 2) *
			Math.sqrt(uniqueReasons.length + 1) *
			Math.sqrt(moduleCount),
		originalColor: color,
		color: color
	});
	var edgeColor =
		typeof module.timestamp === "number"
			? percentageToColor2(module.timestamp / maxTimestamp)
			: undefined;
	uniqueReasons.forEach(function(reason) {
		var parentIdent = reason.moduleIdentifier;
		var parentModule = app.mapModulesIdent["$" + parentIdent];
		if (!parentModule) return;
		var weight = 1 / uniqueReasons.length / uniqueReasons.length;
		var async = !module.chunks.some(function(chunk) {
			return (function isInChunks(chunks, checked) {
				if (chunks.length === 0) return false;
				if (chunks.indexOf(chunk) >= 0) return true;
				chunks = chunks.filter(function(c) {
					return checked.indexOf(c) < 0;
				});
				if (chunks.length === 0) return false;
				return chunks.some(function(c) {
					return isInChunks(app.mapChunks[c].parents, checked.concat(c));
				});
			})(parentModule.chunks, []);
		});
		edges.push({
			id: "edge" + module.uid + "-" + +parentModule.uid,
			sourceModuleUid: parentModule.uid,
			sourceModule: parentModule,
			source: "module" + parentModule.uid,
			targetModule: module,
			targetModuleUid: module.uid,
			target: "module" + module.uid,
			arrow: "target",
			type: async ? "dashedArrow" : "arrow",
			lineDash: module.chunks.length === 0 ? [2] : [5],
			originalColor: edgeColor,
			color: edgeColor,
			size: weight,
			weight: async ? weight / 4 : weight
		});
	});
});
// sigma 3 renders a graphology graph rather than a plain {nodes, edges} literal.
var graph = new Graph({ type: "directed", multi: true });

// sigma 1 settings were maxNodeSize === minNodeSize === 4, i.e. every module
// node drew at a constant size regardless of its `size` attribute.
var NODE_SIZE = 4;
var edgeSize = rescale(
	edges.map(function(edge) {
		return edge.size;
	}),
	0.05,
	2
);

nodes.forEach(function(node) {
	graph.mergeNode(node.id, {
		x: node.x,
		y: node.y,
		size: NODE_SIZE,
		color: node.color,
		originalColor: node.originalColor,
		// sigma 1 drew `shortLabel` via the custom canvas.labels.webpack renderer
		// and the full label only on hover; nodeReducer below reproduces that.
		label: node.shortLabel,
		fullLabel: node.label,
		moduleUid: node.moduleUid,
		module: node.module
	});
});

edges.forEach(function(edge) {
	// mergeEdgeWithKey rather than addEdgeWithKey: two distinct reasons can
	// resolve to the same parent module, which would collide on the same key.
	graph.mergeEdgeWithKey(edge.id, edge.source, edge.target, {
		size: edgeSize(edge.size),
		// Read by forceAtlas2 through its default `weight` edge attribute.
		weight: edge.weight,
		color: edge.color,
		originalColor: edge.originalColor,
		async: edge.type === "dashedArrow",
		sourceModule: edge.sourceModule,
		sourceModuleUid: edge.sourceModuleUid,
		targetModule: edge.targetModule,
		targetModuleUid: edge.targetModuleUid
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
		// sigma 1's `edgeColor: "target"` setting: an explicit edge colour wins,
		// otherwise the edge takes the colour of its target node.
		if (!display.color)
			display.color = graph.getNodeAttribute(graph.target(edge), "color");
		// sigma 1 drew async edges dashed via canvas.edges.dashedArrow. sigma 3
		// is WebGL-only and ships no dashed edge program, so async edges are
		// drawn thinner to keep the distinction visible.
		if (display.async) display.size = display.size / 2;
		return display;
	}
});

var layout = new FA2Layout(graph, {
	settings: Object.assign(forceAtlas2.inferSettings(graph), {
		// Carried over from the old web_modules/sigma.js shim and show() below.
		edgeWeightInfluence: 0.5,
		adjustSizes: false
	})
});

var activeModuleUid = null;

s.on("clickNode", function(e) {
	var moduleUid = graph.getNodeAttribute(e.node, "moduleUid");
	if (moduleUid === activeModuleUid) window.location.hash = "#modules";
	else window.location.hash = "#module/" + moduleUid;
});

exports.show = function() {
	element.style.display = "block";
	// The container has zero dimensions while hidden, so re-measure before
	// refreshing or sigma keeps the stale 0x0 viewport.
	s.resize();
	s.refresh();
	layout.start();
};

exports.hide = function() {
	element.style.display = "none";
	layout.stop();
};

exports.setNormal = function() {
	activeModuleUid = null;
	graph.forEachNode(function(node, attributes) {
		graph.setNodeAttribute(node, "color", attributes.originalColor);
	});
	graph.forEachEdge(function(edge, attributes) {
		graph.setEdgeAttribute(edge, "color", attributes.originalColor);
	});
	s.refresh();
};

exports.setActiveModule = function(activeModule) {
	activeModuleUid = activeModule;
	var colors = {};
	var m = app.mapModulesUid[activeModule];
	m.reasons.forEach(function(r) {
		colors[r.moduleUid] = "#ff0000";
	});
	m.dependencies.forEach(function(d) {
		colors[d.moduleUid] = "#00aa00";
	});
	colors[activeModule] = "#000000";
	graph.forEachNode(function(node, attributes) {
		graph.setNodeAttribute(
			node,
			"color",
			colors[attributes.moduleUid] || "#aaaaaa"
		);
	});
	graph.forEachEdge(function(edge, attributes) {
		var color;
		if (attributes.targetModuleUid === activeModule) color = "#ff0000";
		else if (attributes.sourceModuleUid === activeModule) color = "#00aa00";
		else color = "#aaaaaa";
		graph.setEdgeAttribute(edge, "color", color);
	});
	s.refresh();
};

exports.setActiveChunk = function(activeChunk) {
	activeModuleUid = null;
	graph.forEachNode(function(node, attributes) {
		var m = attributes.module;
		graph.setNodeAttribute(
			node,
			"color",
			m.chunks.indexOf(activeChunk) >= 0 ? "#000000" : "#aaaaaa"
		);
	});
	graph.forEachEdge(function(edge, attributes) {
		var sc = attributes.sourceModule.chunks.indexOf(activeChunk) >= 0;
		var tc = attributes.targetModule.chunks.indexOf(activeChunk) >= 0;
		var color;
		if (sc && tc) color = "#000000";
		else if (sc) color = "#00aa00";
		else if (tc) color = "#ff0000";
		else color = "#aaaaaa";
		graph.setEdgeAttribute(edge, "color", color);
	});
	s.refresh();
};
