var app = require("../app");
var Graph = require("graphology");
var Sigma = require("sigma").Sigma;
var EdgeArrowProgram = require("sigma/rendering").EdgeArrowProgram;
var FA2Layout = require("graphology-layout-forceatlas2/worker");
var forceAtlas2 = require("graphology-layout-forceatlas2");
var rescale = require("./rescale");
var theme = require("./theme");
var legend = require("./legend");
var moduleFilter = require("../moduleFilter");
var formatSize = require("../formatSize");
var percentageToColor = require("../percentageToColor").greenRed;
var percentageToColor2 = require("../percentageToColor").blue;

var element = document.getElementById("sigma-modules");
var legendElement = legend.create(element);

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
					// A stats file written with `chunks: false` still names chunk
					// ids on the modules while leaving the chunks themselves out,
					// so this lookup can come back empty (webpack/analyse#34).
					var parent = app.mapChunks[c];
					return parent
						? isInChunks(parent.parents || [], checked.concat(c))
						: false;
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

// sigma 1 drew every module node at a constant size (its minNodeSize and
// maxNodeSize were both 4), so a 500KB module looked exactly like a 30 byte
// one. Scale by module size instead, through the same fourth root the colour
// scale uses, otherwise a couple of huge modules flatten everything else.
var nodeSize = rescale(
	nodes.map(function(node) {
		return Math.pow(node.size, 1 / 4);
	}),
	2,
	10
);
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
		size: nodeSize(Math.pow(node.size, 1 / 4)),
		color: node.originalColor,
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
		async: edge.type === "dashedArrow",
		sourceModuleUid: edge.sourceModuleUid,
		targetModuleUid: edge.targetModuleUid
	});
});

// What the graph draws, in words. The wording follows the code above: node
// colour and radius come from the module size, edge colour from the timestamp
// of the module the edge points at, and edge width from how many modules ask
// for that same module.
var GRAPH_LEGEND = [
	{
		title: "module",
		items: [
			{
				shape: "dot",
				gradient: legend.gradient(percentageToColor),
				text: "colour and radius: size, 0 to " + formatSize(maxSize)
			}
		]
	},
	{
		title: "dependency",
		items: [
			{ glyph: "\u2192", text: "requires the module it points at" },
			maxTimestamp > 0
				? {
						shape: "line",
						gradient: legend.gradient(percentageToColor2),
						text: "finished building, 0 to " + maxTimestamp + " ms"
					}
				: {
						shape: "line",
						color: "rgba(120,130,140,0.6)",
						text: "coloured like the module it points at"
					},
			{
				shape: "line",
				color: "rgba(120,130,140,0.6)",
				text:
					"thinner when many modules require the same one, and when it " +
					"is loaded from an async chunk"
			}
		]
	}
];

// The roles a module selection paints. A chunk selection paints a different
// set, so the two are kept apart rather than listing every colour the graph
// could ever use next to a view that cannot show most of them.
var MODULE_SELECTION_LEGEND = {
	title: "selected module",
	items: [
		{ shape: "dot", color: theme.ROLE_COLOR.active, text: "the module" },
		{ shape: "dot", color: theme.ROLE_COLOR.reason, text: "requires it" },
		{
			shape: "dot",
			color: theme.ROLE_COLOR.dependency,
			text: "required by it"
		},
		{ shape: "dot", color: theme.FADED_NODE_COLOR, text: "unrelated" }
	]
};

var CHUNK_SELECTION_LEGEND = {
	title: "selected chunk",
	items: [
		{ shape: "dot", color: theme.ROLE_COLOR.member, text: "in the chunk" },
		{
			shape: "line",
			color: theme.ROLE_COLOR.dependency,
			text: "requires a module outside it"
		},
		{
			shape: "line",
			color: theme.ROLE_COLOR.reason,
			text: "required from outside it"
		},
		{ shape: "dot", color: theme.FADED_NODE_COLOR, text: "outside the chunk" }
	]
};

// The filter is set on the modules page but stays on while browsing single
// modules and chunks, where there is no filter box in sight. Saying so in the
// legend is what keeps a half-empty graph from looking like a bug.
function filterGroup() {
	if (!moduleFilter.isActive()) return null;
	var summary = moduleFilter.summary(app.stats.modules);
	return {
		title: "filter",
		items: [
			{
				text:
					"showing " +
					summary.visible +
					" of " +
					summary.total +
					" modules, set on the modules page"
			}
		]
	};
}

// The module whose page is open is drawn whether or not it passes the filter:
// it can be reached from a link on another module or from a chunk, and hiding
// the very thing the page is about would only look broken.
function isDrawn(module) {
	if (!module) return false;
	return moduleFilter.isVisible(module) || module.uid === activeModuleUid;
}

var currentSelectionGroup = null;

function showLegend(selectionGroup) {
	currentSelectionGroup = selectionGroup;
	var groups = GRAPH_LEGEND.concat(selectionGroup || [], filterGroup() || []);
	legend.render(legendElement, groups);
}

showLegend(null);

// null when nothing is selected. Otherwise { nodes: {key: role}, edges: {key:
// role} }. Selection drives appearance through the reducers rather than by
// overwriting colour attributes, so clearing a selection needs no restore pass
// and emphasis can touch size, label and stacking order at the same time.
var selection = null;

// Emphasis has to scale with how much of the graph is selected. Picking a
// module highlights a handful of nodes, and enlarging them is what makes them
// findable. Picking a chunk like `main` selects nearly every module, where the
// same enlargement merges everything into one solid blob and says nothing.
// Past a quarter of the graph, colour carries the selection on its own.
function buildSelection(nodeRoles, edgeRoles) {
	var selected = Object.keys(nodeRoles).length;
	var dense = graph.order > 0 && selected / graph.order > 0.25;
	return {
		nodes: nodeRoles,
		edges: edgeRoles,
		dense: dense,
		emphasis: dense ? { active: 1, related: 1 } : theme.EMPHASIS
	};
}

var s = new Sigma(graph, element, {
	// The graph container is display:none until show() runs, and sigma 3 throws
	// on a zero-width container where sigma 1 tolerated it. show() calls resize()
	// once the element is visible, so the initial invalid size is expected.
	allowInvalidContainer: true,
	defaultEdgeType: "arrow",
	edgeProgramClasses: { arrow: EdgeArrowProgram },
	renderEdgeLabels: false,
	// Lets the selection draw on top of the faded graph instead of being buried
	// under whichever nodes happen to come later in insertion order.
	zIndex: true,
	labelDensity: 0.6,
	labelRenderedSizeThreshold: 6,
	nodeReducer: function(node, data) {
		var display = Object.assign({}, data);
		if (!isDrawn(data.module)) {
			display.hidden = true;
			return display;
		}
		if (data.highlighted) display.label = data.fullLabel;
		if (!selection) return display;

		var role = selection.nodes[node];
		if (!role) {
			display.color = theme.FADED_NODE_COLOR;
			display.size = Math.max(1, data.size * theme.FADED_NODE_SCALE);
			display.label = null;
			display.zIndex = 0;
			return display;
		}
		display.color =
			selection.dense && role === "member"
				? theme.DENSE_MEMBER_COLOR
				: theme.ROLE_COLOR[role];
		display.size =
			data.size *
			(role === "active"
				? selection.emphasis.active
				: selection.emphasis.related);
		// The selected neighbourhood is small, so labelling all of it is what
		// makes the view answer "what depends on this?" at a glance. Short ids
		// only: the active module's full path is already spelled out in the
		// detail panel below, and at this zoom it just collides with its
		// neighbours' labels. Hovering still reveals the full path.
		display.label = data.label;
		// Only the active node forces its label. Forcing all of them opts the
		// whole neighbourhood out of sigma's collision avoidance, and since
		// forceAtlas2 pulls connected nodes tight together the result is a pile
		// of overlapping text. The neighbours stay identifiable by colour and
		// size, and their labels appear as soon as there is room for them.
		display.forceLabel = role === "active";
		// Neighbours sit above the active node: it is the largest thing on
		// screen and would otherwise cover the very nodes being pointed out.
		display.zIndex = role === "active" ? 2 : 3;
		return display;
	},
	edgeReducer: function(edge, data) {
		var display = Object.assign({}, data);
		// An edge is only meaningful while both of its modules are on screen.
		if (
			!isDrawn(app.mapModulesUid[data.sourceModuleUid]) ||
			!isDrawn(app.mapModulesUid[data.targetModuleUid])
		) {
			display.hidden = true;
			return display;
		}
		// sigma 1's `edgeColor: "target"` setting: an explicit edge colour wins,
		// otherwise the edge takes the colour of its target node.
		var color =
			data.color || graph.getNodeAttribute(graph.target(edge), "color");
		// sigma 1 drew async edges dashed via canvas.edges.dashedArrow. sigma 3
		// is WebGL-only and ships no dashed edge program, so async edges are
		// drawn thinner to keep the distinction visible.
		var size = data.async ? data.size / 2 : data.size;

		if (!selection) {
			display.color = theme.withAlpha(color, theme.EDGE_ALPHA);
			display.size = size;
			display.zIndex = 0;
			return display;
		}
		var role = selection.edges[edge];
		if (!role) {
			display.color = theme.withAlpha(color, theme.FADED_EDGE_ALPHA);
			display.size = size;
			display.zIndex = 0;
			return display;
		}
		display.color = theme.withAlpha(
			theme.ROLE_COLOR[role],
			theme.SELECTED_EDGE_ALPHA
		);
		display.size = size * theme.SELECTED_EDGE_SCALE;
		display.zIndex = 1;
		return display;
	}
});

moduleFilter.onChange(function() {
	showLegend(currentSelectionGroup);
	s.refresh();
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
	legend.show(legendElement);
	// The container has zero dimensions while hidden, so re-measure before
	// refreshing or sigma keeps the stale 0x0 viewport.
	s.resize();
	s.refresh();
	layout.start();
};

exports.hide = function() {
	element.style.display = "none";
	legend.hide(legendElement);
	layout.stop();
};

exports.setNormal = function() {
	activeModuleUid = null;
	selection = null;
	showLegend(null);
	s.refresh();
};

exports.setActiveModule = function(activeModule) {
	activeModuleUid = activeModule;
	var roles = {};
	var m = app.mapModulesUid[activeModule];
	// Red for what depends on this module, green for what it depends on: the
	// same reading the graph has always had, now carried by size and stacking
	// order too rather than colour alone.
	m.reasons.forEach(function(r) {
		roles[r.moduleUid] = "reason";
	});
	m.dependencies.forEach(function(d) {
		roles[d.moduleUid] = "dependency";
	});
	roles[activeModule] = "active";

	var nodeRoles = {};
	graph.forEachNode(function(node, attributes) {
		var role = roles[attributes.moduleUid];
		if (role) nodeRoles[node] = role;
	});
	var edgeRoles = {};
	graph.forEachEdge(function(edge, attributes) {
		if (attributes.targetModuleUid === activeModule) edgeRoles[edge] = "reason";
		else if (attributes.sourceModuleUid === activeModule)
			edgeRoles[edge] = "dependency";
	});
	selection = buildSelection(nodeRoles, edgeRoles);
	showLegend(MODULE_SELECTION_LEGEND);
	s.refresh();
};

exports.setActiveChunk = function(activeChunk) {
	activeModuleUid = null;
	var nodeRoles = {};
	var inChunk = {};
	graph.forEachNode(function(node, attributes) {
		var member = attributes.module.chunks.indexOf(activeChunk) >= 0;
		inChunk[attributes.moduleUid] = member;
		if (member) nodeRoles[node] = "member";
	});
	var edgeRoles = {};
	graph.forEachEdge(function(edge, attributes) {
		var sc = inChunk[attributes.sourceModuleUid];
		var tc = inChunk[attributes.targetModuleUid];
		if (sc && tc) edgeRoles[edge] = "member";
		else if (sc) edgeRoles[edge] = "dependency";
		else if (tc) edgeRoles[edge] = "reason";
	});
	selection = buildSelection(nodeRoles, edgeRoles);
	showLegend(CHUNK_SELECTION_LEGEND);
	s.refresh();
};
