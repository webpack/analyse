// Finds circular dependencies in the module graph.
//
// Only modules inside a strongly connected component can be part of a cycle,
// so the search is limited to the non-trivial components found by Tarjan's
// algorithm. Inside a component every elementary circuit is enumerated from
// its lowest module, which reports each circuit exactly once. The number of
// circuits can grow exponentially with the size of a component, so both the
// number of reported cycles and the search effort are capped.

// Reasons a module lists for referring to itself, e.g. `exports` in a
// CommonJS module. They are not dependencies on another module and would
// otherwise turn a large part of the graph into one-module cycles.
var SELF_REFERENCE_TYPES = {
	"cjs self exports reference": true,
	"module decorator": true
};

var DEFAULT_MAX_CYCLES = 4;
var DEFAULT_MAX_STEPS = 10000;

// Both algorithms below are written with an explicit stack instead of
// recursion, because the graph can be deeper than the JS call stack allows.

function buildAdjacency(modules) {
	var nodeByUid = {};
	modules.forEach(function(module, node) {
		if (typeof module.uid === "number") nodeByUid[module.uid] = node;
	});
	return modules.map(function(module) {
		var edges = [];
		var seen = {};
		(module.dependencies || []).forEach(function(dependency) {
			if (SELF_REFERENCE_TYPES[dependency.type] === true) return;
			var node = nodeByUid[dependency.moduleUid];
			// Multiple references to the same module are a single edge here,
			// the first one is kept to point at the source location.
			if (typeof node !== "number" || seen[node]) return;
			seen[node] = true;
			edges.push({ node: node, dependency: dependency });
		});
		return edges;
	});
}

function findStronglyConnectedComponents(adjacency) {
	var index = [];
	var lowlink = [];
	var onStack = [];
	var componentOfNode = [];
	var stack = [];
	var components = [];
	var nextIndex = 0;
	adjacency.forEach(function(_, root) {
		if (typeof index[root] === "number") return;
		var work = [{ node: root, edge: 0 }];
		while (work.length > 0) {
			var frame = work[work.length - 1];
			var node = frame.node;
			if (frame.edge === 0) {
				index[node] = lowlink[node] = nextIndex++;
				onStack[node] = true;
				stack.push(node);
			}
			var edges = adjacency[node];
			var descended = false;
			while (frame.edge < edges.length) {
				var next = edges[frame.edge++].node;
				if (typeof index[next] !== "number") {
					work.push({ node: next, edge: 0 });
					descended = true;
					break;
				}
				if (onStack[next] && index[next] < lowlink[node])
					lowlink[node] = index[next];
			}
			if (descended) continue;
			if (lowlink[node] === index[node]) {
				var component = [];
				var member;
				do {
					member = stack.pop();
					onStack[member] = false;
					componentOfNode[member] = components.length;
					component.push(member);
				} while (member !== node);
				components.push(
					component.sort(function(a, b) {
						return a - b;
					})
				);
			}
			work.pop();
			if (work.length > 0) {
				var parent = work[work.length - 1].node;
				if (lowlink[node] < lowlink[parent]) lowlink[parent] = lowlink[node];
			}
		}
	});
	return { components: components, componentOfNode: componentOfNode };
}

// Enumerates the elementary circuits of one component. A circuit is only
// reported when it is entered through its lowest module, so rotations of the
// same circuit are not reported twice.
function findCyclesInComponent(adjacency, componentOfNode, component, state) {
	var componentId = componentOfNode[component[0]];
	for (var i = 0; i < component.length; i++) {
		var start = component[i];
		var path = [start];
		var takenEdges = [];
		var nextEdge = [0];
		var onPath = {};
		onPath[start] = true;
		while (path.length > 0) {
			var depth = path.length - 1;
			var node = path[depth];
			var edges = adjacency[node];
			var descended = false;
			while (nextEdge[depth] < edges.length) {
				if (state.steps++ >= state.maxSteps) {
					state.truncated = true;
					return;
				}
				var edge = edges[nextEdge[depth]++];
				var next = edge.node;
				// Modules below the start are covered by an earlier start, and
				// modules of other components can never lead back here.
				if (next < start || componentOfNode[next] !== componentId) continue;
				if (next === start) {
					state.cycles.push({
						nodes: path.slice(),
						dependencies: takenEdges.slice(0, depth).concat(edge.dependency)
					});
					// One cycle more than requested is collected to know for sure
					// that there are more cycles than the reported ones.
					if (state.cycles.length > state.maxCycles) {
						state.truncated = true;
						return;
					}
					continue;
				}
				if (onPath[next]) continue;
				takenEdges[depth] = edge.dependency;
				path.push(next);
				nextEdge.push(0);
				onPath[next] = true;
				descended = true;
				break;
			}
			if (descended) continue;
			delete onPath[node];
			path.pop();
			nextEdge.pop();
		}
	}
}

module.exports = function findCircularDependencies(modules, options) {
	options = options || {};
	var adjacency = buildAdjacency(modules);
	var scc = findStronglyConnectedComponents(adjacency);
	var state = {
		cycles: [],
		steps: 0,
		truncated: false,
		maxCycles: options.maxCycles || DEFAULT_MAX_CYCLES,
		maxSteps: options.maxSteps || DEFAULT_MAX_STEPS
	};
	var moduleCount = 0;
	var componentCount = 0;
	scc.components.forEach(function(component) {
		var isCyclic =
			component.length > 1 ||
			adjacency[component[0]].some(function(edge) {
				return edge.node === component[0];
			});
		if (!isCyclic) return;
		moduleCount += component.length;
		componentCount++;
		if (state.truncated) return;
		findCyclesInComponent(adjacency, scc.componentOfNode, component, state);
	});
	var cycles = state.cycles.slice(0, state.maxCycles).map(function(cycle) {
		return {
			modules: cycle.nodes.map(function(node) {
				return modules[node];
			}),
			dependencies: cycle.dependencies
		};
	});
	// Short cycles are the easiest ones to understand and to break.
	cycles.sort(function(a, b) {
		if (a.modules.length !== b.modules.length)
			return a.modules.length - b.modules.length;
		return a.modules[0].uid - b.modules[0].uid;
	});
	return {
		cycles: cycles,
		truncated: state.truncated,
		moduleCount: moduleCount,
		componentCount: componentCount
	};
};
