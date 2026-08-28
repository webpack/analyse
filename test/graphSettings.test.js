// Checks when the graphs draw themselves and when they stay out of the way.
// Run with `npm test`.
var test = require("node:test");
var assert = require("node:assert");

var app = require("../app/app");

// The setting remembers a choice for as long as the page lives, so each test
// asks for a module of its own rather than inheriting the last one's answer.
function fresh() {
	delete require.cache[require.resolve("../app/graphs/settings")];
	return require("../app/graphs/settings");
}

function stats(modules, chunks) {
	app.stats = { modules: new Array(modules), chunks: new Array(chunks) };
}

test("draws the graphs for a build of an ordinary size", function() {
	stats(1034, 155);
	var settings = fresh();
	assert.strictEqual(settings.tooBig(), false);
	assert.strictEqual(settings.enabled(), true);
});

test("keeps them off for a build big enough to hang the tab", function() {
	stats(50000, 12);
	var settings = fresh();
	assert.strictEqual(settings.tooBig(), true);
	assert.strictEqual(settings.enabled(), false);
});

test("counts chunks as well as modules", function() {
	stats(10, 50000);
	var settings = fresh();
	assert.strictEqual(settings.tooBig(), true);
	assert.strictEqual(settings.enabled(), false);
});

test("lets the reader overrule either default", function() {
	stats(50000, 12);
	var big = fresh();
	big.set(true);
	assert.strictEqual(big.enabled(), true, "asked for the graph anyway");
	assert.strictEqual(big.tooBig(), true, "and is still told why it was off");

	stats(100, 2);
	var small = fresh();
	small.set(false);
	assert.strictEqual(small.enabled(), false, "asked for no graph");
});

test("tells the graphs when the choice changes", function() {
	stats(100, 2);
	var settings = fresh();
	var changes = 0;
	settings.onChange(function() {
		changes++;
	});
	settings.set(false);
	settings.set(true);
	assert.strictEqual(changes, 2);
});

test("survives having nowhere to remember the choice", function() {
	// No window in node, so reading and writing the choice both throw; the
	// setting has to carry on with the choice held in memory only.
	stats(100, 2);
	var settings = fresh();
	assert.doesNotThrow(function() {
		settings.set(false);
	});
	assert.strictEqual(settings.enabled(), false);
});

test("copes with stats that carry no modules or chunks", function() {
	app.stats = null;
	var settings = fresh();
	assert.strictEqual(settings.moduleCount(), 0);
	assert.strictEqual(settings.chunkCount(), 0);
	assert.strictEqual(settings.enabled(), true);
});
