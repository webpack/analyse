// Checks the module filter behind the modules page and the module graph.
// Run with `npm test`.
var test = require("node:test");
var assert = require("node:assert");

var moduleFilter = require("../app/moduleFilter");
var example = require("../app/pages/upload/example1.json");

function reset() {
	moduleFilter.set({ query: "", hideThirdParty: false });
}

function mod(name, size) {
	return { name: name, identifier: name, size: size || 100 };
}

var SOURCE = mod("./src/app.js");
var STYLE = mod("(webpack)/~/css-loader!./lib/stylesheet.css");
var VENDOR = mod("./node_modules/lodash/index.js");
var VENDOR_TILDE = mod("(webpack)/~/style-loader/addStyles.js");
var CONTEXT = mod(
	"(webpack)/test/cases/loaders sync " +
		"(webpack)/node_modules/raw-loader/x.js ^\\.\\/.*$"
);

function visible(modules) {
	return modules.filter(moduleFilter.isVisible).map(function(module) {
		return module.name;
	});
}

test("shows everything when nothing is filtered", function() {
	reset();
	assert.strictEqual(moduleFilter.isActive(), false);
	assert.deepStrictEqual(visible([SOURCE, VENDOR]), [SOURCE.name, VENDOR.name]);
});

test("matches a query as a case-insensitive substring", function() {
	reset();
	moduleFilter.set({ query: "STYLEsheet" });
	assert.deepStrictEqual(visible([SOURCE, STYLE, VENDOR]), [STYLE.name]);
	assert.strictEqual(moduleFilter.isActive(), true);
});

test("reads a query wrapped in slashes as a regexp", function() {
	reset();
	moduleFilter.set({ query: "/\\.css$/" });
	assert.deepStrictEqual(visible([SOURCE, STYLE, VENDOR]), [STYLE.name]);
	moduleFilter.set({ query: "/^\\.\\/SRC/i" });
	assert.deepStrictEqual(visible([SOURCE, STYLE, VENDOR]), [SOURCE.name]);
});

test("keeps showing everything while a regexp is unfinished", function() {
	reset();
	moduleFilter.set({ query: "/[unclosed/" });
	assert.ok(moduleFilter.error, "the broken pattern is reported");
	assert.strictEqual(moduleFilter.isActive(), false);
	assert.deepStrictEqual(visible([SOURCE, VENDOR]), [SOURCE.name, VENDOR.name]);
	// And recovers once it parses.
	moduleFilter.set({ query: "/lodash/" });
	assert.strictEqual(moduleFilter.error, null);
	assert.deepStrictEqual(visible([SOURCE, VENDOR]), [VENDOR.name]);
});

test("hides third-party modules by their file, not their loaders", function() {
	reset();
	moduleFilter.set({ hideThirdParty: true });
	// STYLE is a source file that a loader from node_modules built, and CONTEXT
	// is a directory of source files whose matcher names such a loader. Testing
	// the whole name would hide both.
	assert.deepStrictEqual(
		visible([SOURCE, STYLE, CONTEXT, VENDOR, VENDOR_TILDE]),
		[SOURCE.name, STYLE.name, CONTEXT.name]
	);
});

test("combines the query with the third-party switch", function() {
	reset();
	moduleFilter.set({ query: "index", hideThirdParty: true });
	assert.deepStrictEqual(visible([SOURCE, VENDOR, mod("./src/index.js")]), [
		"./src/index.js"
	]);
});

test("counts what is showing and what it weighs", function() {
	reset();
	var modules = [mod("./src/a.js", 100), mod("./node_modules/b.js", 400)];
	moduleFilter.set({ hideThirdParty: true });
	assert.deepStrictEqual(moduleFilter.summary(modules), {
		visible: 1,
		total: 2,
		visibleSize: 100,
		totalSize: 500
	});
});

test("holds up against a real stats file", function() {
	reset();
	moduleFilter.set({ hideThirdParty: true });
	var summary = moduleFilter.summary(example.modules);
	assert.ok(
		summary.visible < summary.total,
		"example1 does contain third-party modules"
	);
	assert.ok(summary.visible > summary.total / 2, "and is mostly its own code");
	var byName = {};
	example.modules.forEach(function(module) {
		byName[module.name] = module;
	});
	assert.strictEqual(
		moduleFilter.isVisible(byName["(webpack)/~/style-loader/addStyles.js"]),
		false
	);
	assert.strictEqual(
		moduleFilter.isVisible(byName["./lib/stylesheet.css"]),
		true
	);
	reset();
});
