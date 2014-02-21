function hsv2rgb(h, s, v) {
	h = (h % 1 + 1) % 1; // wrap hue

	var i = Math.floor(h * 6),
		f = h * 6 - i,
		p = v * (1 - s),
		q = v * (1 - s * f),
		t = v * (1 - s * (1 - f));

	switch (i) {
		case 0: return [v, t, p];
		case 1: return [q, v, p];
		case 2: return [p, v, t];
		case 3: return [p, q, v];
		case 4: return [t, p, v];
		case 5: return [v, p, q];
	}
}

module.exports = function percentageToColor(p) {
	var rgb = hsv2rgb(p, 1, 0.7);
	return "rgb(" + rgb.map(function(x) { return Math.floor(256*x); }).join(",") + ")";
}
