var app = require("../../app");
var modulesGraph = require("../../graphs/modules");

/** general breadth first search between start and end */
function findPathBetween(start, end, getChildren) {
	var todo = [start];
	var done = new Set();
	var parent = new Map();

	while(todo.length > 0) {
		var cur = todo.shift();
		if(cur === end) return getPath(start, end, parent);
		var children = getChildren(cur);
		for(var i = 0; i < children.length; i++) {
			var child = children[i];
			if(done.has(child)) continue;
			if(todo.indexOf(child) < 0) todo.push(child);
			parent.set(child, cur);
		}
		done.add(cur);
	}
	function getPath(start, end, parent) {
		var path = [end];
		while(path[0] !== start) {
			path.unshift(parent.get(path[0]));
		}
		return path;
	}
}

function getReasonChains(app, id) {
	var m = app.mapModulesUid[id];
	var chains = [];
	for(var i = 0; i < m.chunks.length; i++) {
		var chunkId = m.chunks[i];
		var chunk = app.stats.chunks[chunkId];
		console.assert(chunk.id === chunkId);
		for(var j = 0; j < chunk.origins.length; j++) {
			var mo = chunk.origins[j];
			var origin = mo.moduleUid;
			var p = findPathBetween(origin, id, function getChildren(id) {
				var m = app.mapModulesUid[id];
				return m.dependencies.filter(function(p) {return p.type !== "context element"}).map(function(p) {return p.moduleUid});
			});
			chains.push({
				chunk: chunkId,
				origin: origin,
				modules: (p || []).map(function(x) {return app.mapModulesUid[x]})
			})
		}
	}
	return chains;
}

module.exports = function(id) {
	id = parseInt(id, 10);
	var m = app.mapModulesUid[id];
	document.title = "module " + m.id;

	$(".page").html(require("./module.jade")({
		stats: app.stats,
		id: id,
		module: m,
		issuer: app.mapModulesUid[m.issuerUid],
		reason_chains: getReasonChains(app, id)
	}));
	modulesGraph.show();
	modulesGraph.setActiveModule(id);
	return function() {
		modulesGraph.hide();
	}
};