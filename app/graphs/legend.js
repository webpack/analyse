// The graphs say a lot with colour, size and arrow direction, and none of it
// was written down anywhere in the UI (webpack/analyse#29).
//
// A legend is only worth having if it cannot drift away from the drawing, so
// nothing here holds a colour of its own: swatches are filled by sampling the
// very scales the graphs are drawn with, and the graphs pass in the values
// their scales run over.

// Inserts an empty legend after the graph container. Hidden until the graph it
// belongs to is shown.
exports.create = function create(graphElement) {
	var element = document.createElement("div");
	element.className = "graph-legend";
	element.style.display = "none";
	graphElement.parentNode.insertBefore(element, graphElement.nextSibling);
	return element;
};

exports.show = function show(element) {
	element.style.display = "";
};

exports.hide = function hide(element) {
	element.style.display = "none";
};

// Samples a percentageToColor scale into the stops of a CSS gradient, so a
// swatch shows the range a value is actually drawn in rather than an
// approximation of it.
exports.gradient = function gradient(scale, steps) {
	var stops = [];
	steps = steps || 6;
	for (var i = 0; i < steps; i++) stops.push(scale(i / (steps - 1)));
	return stops;
};

// groups: [{ title, items: [{ shape, color | gradient | glyph, text }] }]
// shape is "dot" for anything drawn as a node and "line" for anything drawn as
// an edge, which is the only distinction the graphs make.
exports.render = function render(element, groups) {
	element.textContent = "";
	groups.forEach(function(group) {
		var groupElement = document.createElement("div");
		groupElement.className = "graph-legend-group";
		if (group.title) {
			var title = document.createElement("span");
			title.className = "graph-legend-title";
			title.textContent = group.title;
			groupElement.appendChild(title);
		}
		group.items.forEach(function(item) {
			groupElement.appendChild(renderItem(item));
		});
		element.appendChild(groupElement);
	});
};

function renderItem(item) {
	var element = document.createElement("span");
	element.className = "graph-legend-item";
	element.appendChild(renderSwatch(item));
	var text = document.createElement("span");
	text.textContent = item.text;
	element.appendChild(text);
	return element;
}

function renderSwatch(item) {
	var swatch = document.createElement("span");
	if (item.glyph) {
		swatch.className = "graph-legend-glyph";
		swatch.textContent = item.glyph;
		return swatch;
	}
	swatch.className =
		"graph-legend-swatch graph-legend-swatch-" + (item.shape || "dot");
	if (item.gradient) {
		swatch.style.backgroundImage =
			"linear-gradient(to right," + item.gradient.join(",") + ")";
	} else {
		swatch.style.backgroundColor = item.color;
	}
	return swatch;
}
