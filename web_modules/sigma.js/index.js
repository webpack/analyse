require("imports-loader?this=>window&module=>undefined&exports=>undefined!./sigma.min.js");

// sigma 1.2's forceAtlas2 runs in a web worker and captures the global as
// `var _root = this`, so it needs the same this=>window rewrite as the core
// build. Without it the supervisor calls postMessage on webpack's module
// scope and throws. sigma 1.0's non-worker forceAtlas2 did not need this.
require("imports-loader?this=>window&module=>undefined&exports=>undefined!./plugins/sigma.layout.forceAtlas2.min.js");

module.exports = sigma;

sigma.canvas.labels.webpack = function(node, context, settings) {
	var old = node.label;
	if (node.shortLabel) node.label = node.shortLabel;
	sigma.canvas.labels.def(node, context, settings);
	node.label = old;
};

sigma.canvas.edges.dashedArrow = function(
	edge,
	source,
	target,
	context,
	settings
) {
	if (!context.getLineDash || !context.setLineDash)
		return sigma.canvas.edges.def(edge, source, target, context, settings);
	var old = context.getLineDash();
	context.setLineDash(edge.lineDash || [5, 5]);
	sigma.canvas.edges.arrow(edge, source, target, context, settings);
	context.setLineDash(old);
};
