// Shared visual language for the module and chunk graphs.
//
// Both graphs are dense enough that the default "everything at full strength"
// rendering reads as a hairball: saturated edges cover the nodes, and once a
// selection is made the handful of highlighted nodes are lost among a thousand
// unrelated ones. The constants here express one rule: whatever is currently
// relevant is drawn larger, more opaque and on top, and everything else recedes.

// percentageToColor emits "rgb(r,g,b)" and the role colours below are hex, so
// fading is a string rewrite rather than a second colour scale.
exports.withAlpha = function withAlpha(color, alpha) {
	if (typeof color !== "string") return color;
	var rgb = color.match(/^rgba?\(([^)]+)\)$/);
	if (rgb) {
		var parts = rgb[1].split(",").slice(0, 3).map(function(part) {
			return part.trim();
		});
		return "rgba(" + parts.join(",") + "," + alpha + ")";
	}
	var hex = color.match(/^#([0-9a-f]{6})$/i);
	if (hex) {
		var n = parseInt(hex[1], 16);
		return (
			"rgba(" +
			[(n >> 16) & 255, (n >> 8) & 255, n & 255].join(",") +
			"," +
			alpha +
			")"
		);
	}
	return color;
};

// Roles keep the meaning the graphs have always had: red points at whatever
// depends on the selection, green at what the selection depends on.
exports.ROLE_COLOR = {
	active: "#111111",
	reason: "#d7191c",
	dependency: "#1a9641",
	member: "#111111"
};

// How much bigger a node gets when it is part of the current selection.
exports.EMPHASIS = {
	active: 2.2,
	related: 1.7
};

// Unrelated items keep their position (they are still the shape of the graph)
// but drop back to a flat wash so the selection reads on top of them.
// Tuned so the rest of the graph still reads as a shape you can locate the
// selection within. Any fainter and the surrounding structure disappears
// entirely, which loses the "where does this sit?" half of the question.
exports.FADED_NODE_COLOR = "rgba(168,176,186,0.75)";
exports.FADED_NODE_SCALE = 0.7;
exports.FADED_EDGE_ALPHA = 0.09;

// Edges carry real meaning (timestamp, weight) but at full opacity they bury
// the nodes, so they sit behind a little transparency by default.
//
// The two graphs need different amounts of it. The module graph is a thousand
// nodes deep and its edges are what turn it into a hairball, so they are held
// well back. The chunk graph is sparse and its edges are the parent structure
// worth seeing, so they only come back far enough to stop swamping the nodes.
exports.EDGE_ALPHA = 0.3;
exports.SPARSE_EDGE_ALPHA = 0.55;

// A chunk like `main` contains nearly every module, so a flat opaque fill turns
// the dense core into a featureless void. A little transparency lets the
// overlap read as density instead, and keeps the edges leaving the chunk
// visible through it.
exports.DENSE_MEMBER_COLOR = "rgba(17,17,17,0.62)";
exports.SELECTED_EDGE_ALPHA = 0.95;
exports.SELECTED_EDGE_SCALE = 2.2;
