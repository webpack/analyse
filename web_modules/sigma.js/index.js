require("imports?this=>window&module=>undefined&exports=>undefined!./sigma.min.js");

require("./patch-force-atlas!./plugins/sigma.layout.forceAtlas2.min.js");

module.exports = sigma;

sigma.canvas.labels.webpack = function(node, context, settings) {
	var old = node.label;
	if(node.shortLabel) node.label = node.shortLabel;
	sigma.canvas.labels.def(node, context, settings);
	node.label = old;
};

sigma.canvas.edges.dashedArrow = function(edge, source, target, context, settings) {
	if(!context.getLineDash || !context.setLineDash) return sigma.canvas.edges.array(edge, source, target, context, settings);
	var old = context.getLineDash();
	context.setLineDash(edge.lineDash || [5, 5]);
	sigma.canvas.edges.arrow(edge, source, target, context, settings);
	context.setLineDash(old);
}

sigma.layout.forceatlas2.edgeWeightInfluence = 0.5;
sigma.layout.forceatlas2.adjustSizes = true;
