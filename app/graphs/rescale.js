// sigma 1.x rescaled every node/edge `size` into the range configured by its
// minNodeSize/maxNodeSize and minEdgeSize/maxEdgeSize settings. sigma 3 dropped
// those settings and renders the raw `size` value, so the sizes the graphs were
// tuned for have to be normalised by hand before handing them to the renderer.
//
// Returns a function mapping a raw size onto [min, max]. When every input is
// identical there is no spread to map, so everything renders at `max`, which is
// what sigma 1 did for a degenerate range.
module.exports = function rescale(values, min, max) {
	var lo = Infinity;
	var hi = -Infinity;
	values.forEach(function(value) {
		if (typeof value !== "number" || !isFinite(value)) return;
		if (value < lo) lo = value;
		if (value > hi) hi = value;
	});
	return function(value) {
		if (!isFinite(lo) || !isFinite(hi) || hi === lo) return max;
		if (typeof value !== "number" || !isFinite(value)) return min;
		return min + ((value - lo) / (hi - lo)) * (max - min);
	};
};
