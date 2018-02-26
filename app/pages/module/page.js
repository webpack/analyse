var app = require("../../app");
var modulesGraph = require("../../graphs/modules");

/** general breadth first search between start and end */
function findPathBetween(start, end, getChildren) {
	const todo = [start];
	const done = new Set();
	const parent = new Map();

	while(todo.length > 0) {
		const cur = todo.shift();
		if(cur === end) return getPath(start, end, parent);
		for(const child of getChildren(cur)) {
			if(done.has(child)) continue;
			if(todo.indexOf(child) < 0) todo.push(child);
			parent.set(child, cur);
		}
		done.add(cur);
	}
	function getPath(start, end, parent) {
		const path = [end];
		while(path[0] !== start) {
			path.unshift(parent.get(path[0]));
		}
		return path;
	}
}

function getReasonChains(app, id) {
	const m = app.mapModulesUid[id];
	const chains = [];
	for(const chunkId of m.chunks) {
		const chunk = app.stats.chunks[chunkId];
		console.assert(chunk.id === chunkId);
		for(const mo of chunk.origins) {
			const origin = mo.moduleUid;
			const p = findPathBetween(origin, id, function getChildren(id) {
				const m = app.mapModulesUid[id];
				return m.dependencies.filter(p => p.type !== "context element").map(p => p.moduleUid);
			});
			chains.push({
				chunk: chunkId,
				origin,
				modules: (p || []).map(x => app.mapModulesUid[x])
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