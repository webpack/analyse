// Shared filter for the module list and the module graph (webpack/analyse#11).
//
// A build of any size arrives with far more modules than the ones being looked
// for, and until now the only way to see just your own was to edit the stats
// file by hand. The filter state lives here rather than in the page, so the
// table and the graph always agree on what is showing, and the graph keeps the
// filter while navigating between modules and chunks.

var listeners = [];

exports.query = "";
exports.hideThirdParty = false;
// Set when the query looks like a regular expression but does not compile. The
// filter falls back to showing everything, so a half-typed pattern never
// blanks the page.
exports.error = null;

var match = null;

exports.set = function set(changes) {
	if ("query" in changes) exports.query = changes.query;
	if ("hideThirdParty" in changes)
		exports.hideThirdParty = changes.hideThirdParty;
	match = compile(exports.query);
	listeners.forEach(function(listener) {
		listener();
	});
};

exports.onChange = function onChange(listener) {
	listeners.push(listener);
};

exports.isActive = function isActive() {
	return exports.hideThirdParty || (!!match && !exports.error);
};

exports.isVisible = function isVisible(module) {
	if (exports.hideThirdParty && isThirdParty(module)) return false;
	if (!match || exports.error) return true;
	return match(module);
};

exports.summary = function summary(modules) {
	var result = { visible: 0, total: 0, visibleSize: 0, totalSize: 0 };
	modules.forEach(function(module) {
		var size = module.size || 0;
		result.total++;
		result.totalSize += size;
		if (!exports.isVisible(module)) return;
		result.visible++;
		result.visibleSize += size;
	});
	return result;
};

// "/^\.\/src/i" is read as a regular expression, anything else as a
// case-insensitive substring, which is what a filter box is expected to do.
function compile(query) {
	exports.error = null;
	query = (query || "").trim();
	if (!query) return null;
	var re = query.match(/^\/(.*)\/([a-z]*)$/);
	if (re) {
		try {
			var expression = new RegExp(re[1], re[2]);
			return function(module) {
				return expression.test(module.name || module.identifier || "");
			};
		} catch (err) {
			exports.error = err.message;
			return null;
		}
	}
	var needle = query.toLowerCase();
	return function(module) {
		return (
			(module.name || "").toLowerCase().indexOf(needle) >= 0 ||
			(module.identifier || "").toLowerCase().indexOf(needle) >= 0
		);
	};
}

// A module name puts its loaders in front of the resource
// ("css-loader!./a.css") and a context module puts its mode and matcher behind
// the directory ("./dir sync ^\.\/.*$"), so what has to be tested is neither
// the whole name nor simply its last piece. Getting this wrong would hide a
// source file only because a third-party loader built it.
function resourceOf(module) {
	var name = module.name || module.identifier || "";
	var parts = name.split("!");
	var resource = parts[parts.length - 1];
	var context = resource.match(
		/^(\S+) (?:sync|eager|weak|lazy|lazy-once|optional)\b/
	);
	return context ? context[1] : resource;
}

// `~` is how webpack 1 wrote node_modules in the names it reported.
var THIRD_PARTY = /(^|[\\/])(node_modules|~)[\\/]/;

function isThirdParty(module) {
	return THIRD_PARTY.test(resourceOf(module));
}

exports.isThirdParty = isThirdParty;
