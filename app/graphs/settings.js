// Whether the graphs are drawn at all (webpack/analyse#38).
//
// The layout builds a node per module and an edge per reason and then runs a
// force simulation over them, which a build of tens of thousands of modules
// can turn into a hang or a dead tab. Until now the only way out was to fork
// the app and comment the graphs out, so the choice lives here instead: it is
// remembered per browser, and a build large enough to be a problem starts with
// the graphs off, because crashing on first sight of a stats file is a poor
// way to find out that a setting exists.

var app = require("../app");

var STORAGE_KEY = "analyse.graphs";

// Roughly where the force layout stops settling in a reasonable time. The two
// bundled examples, at 256 and 1034 modules, are nowhere near it.
var TOO_BIG = 5000;

var listeners = [];
// null while the reader has not said either way, which leaves the size of the
// build to decide.
var choice = read();

exports.enabled = function enabled() {
	if (choice !== null) return choice;
	return !exports.tooBig();
};

exports.tooBig = function tooBig() {
	return exports.moduleCount() > TOO_BIG || exports.chunkCount() > TOO_BIG;
};

exports.moduleCount = function moduleCount() {
	return count(app.stats && app.stats.modules);
};

exports.chunkCount = function chunkCount() {
	return count(app.stats && app.stats.chunks);
};

exports.set = function set(on) {
	choice = !!on;
	write(choice);
	listeners.forEach(function(listener) {
		listener();
	});
};

exports.onChange = function onChange(listener) {
	listeners.push(listener);
};

function count(list) {
	return list ? list.length : 0;
}

function read() {
	try {
		var stored = window.localStorage.getItem(STORAGE_KEY);
		if (stored === "on") return true;
		if (stored === "off") return false;
	} catch (err) {
		// Storage can be unavailable: private windows, blocked cookies, or no
		// browser at all under the tests. The choice then lasts as long as the
		// page does, which is still better than not being able to make it.
	}
	return null;
}

function write(on) {
	try {
		window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
	} catch (err) {
		// As above.
	}
}
