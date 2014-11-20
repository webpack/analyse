var app = require("../app");
var sigma = require("sigma.js");
var findById = require("../findById");
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
	if(module.size > maxSize) maxSize = module.size;
	if(module.timestamp > maxTimestamp) maxTimestamp = module.timestamp;
});
app.stats.modules.forEach(function(module, idx) {
	var color = percentageToColor(Math.pow((module.size+1) / (maxSize+1), 1/4));
	var done = {};
	var uniqueReasons = module.reasons.filter(function(reason) {
		var parent = reason.module;
		if(done["$"+parent]) return false;
		done["$"+parent] = true;
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
		x: Math.cos(idx / moduleCount * Math.PI * 2) * Math.sqrt(uniqueReasons.length + 1) * Math.sqrt(moduleCount),
		y: Math.sin(idx / moduleCount * Math.PI * 2) * Math.sqrt(uniqueReasons.length + 1) * Math.sqrt(moduleCount),
		originalColor: color,
		color: color
	});
	var edgeColor = typeof module.timestamp === "number" ? percentageToColor2(module.timestamp / maxTimestamp) : undefined;
	uniqueReasons.forEach(function(reason) {
		var parentIdent = reason.moduleIdentifier;
		var parentModule = app.mapModulesIdent["$"+parentIdent];
		if(!parentModule) return;
		var weight = 1 / uniqueReasons.length / uniqueReasons.length;
		var async = !module.chunks.some(function(chunk) {
			return (function isInChunks(chunks, checked) {
				if(chunks.length === 0) return false;
				if(chunks.indexOf(chunk) >= 0) return true;
				chunks = chunks.filter(function(c) {
					return checked.indexOf(c) < 0;
				});
				if(chunks.length === 0) return false;
				return chunks.some(function(c) {
					return isInChunks(app.mapChunks[c].parents, checked.concat(c));
				});
			}(parentModule.chunks, []));
		});
		edges.push({
			id: "edge" + module.uid + "-" + + parentModule.uid,
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
var s = new sigma({
	graph: {
		nodes: nodes,
		edges: edges
	},
	renderer: {
		type: "canvas",
		container: element
	},
	settings: {
		edgeColor: "target",
		maxNodeSize: 4,
		minNodeSize: 4,
		maxEdgeSize: 2,
		minEdgeSize: 0.05
	}
});

var activeModuleUid = null;

s.bind("clickNode", function(e) {
	if(e.data.node.moduleUid === activeModuleUid)
		window.location.hash = "#modules";
	else
		window.location.hash = "#module/" + e.data.node.moduleUid;
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

exports.setNormal = function() {
	activeModuleUid = null;
	s.graph.nodes().forEach(function(n) {
		n.color = n.originalColor;
		n.active = false;
	});
	s.graph.edges().forEach(function(e) {
		e.color = e.originalColor;
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
	s.graph.nodes().forEach(function(n) {
		n.color = colors[n.moduleUid] || "#aaaaaa";
	});
	s.graph.edges().forEach(function(e) {
		if(e.targetModuleUid === activeModule)
			e.color = "#ff0000";
		else if(e.sourceModuleUid === activeModule)
			e.color = "#00aa00";
		else
			e.color = "#aaaaaa";
	});
	s.refresh();
};

exports.setActiveChunk = function(activeChunk) {
	activeModuleUid = null;
	s.graph.nodes().forEach(function(n) {
		var m = n.module;
		if(m.chunks.indexOf(activeChunk) >= 0)
			n.color = "#000000";
		else
			n.color = "#aaaaaa";
		n.active = false;
	});
	s.graph.edges().forEach(function(e) {
		var sm = e.sourceModule;
		var tm = e.targetModule;
		var sc = sm.chunks.indexOf(activeChunk) >= 0;
		var tc = tm.chunks.indexOf(activeChunk) >= 0
		if(sc && tc)
			e.color = "#000000";
		else if(sc)
			e.color = "#00aa00";
		else if(tc)
			e.color = "#ff0000";
		else
			e.color = "#aaaaaa";
	});
	s.refresh();
};
