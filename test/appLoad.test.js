// Checks that reading a stats file survives the parts a stats file is allowed
// to leave out (webpack/analyse#34). Run with `npm test`.
var test = require("node:test");
var assert = require("node:assert");

var app = require("../app/app");

function load(stats) {
	// Loading reports to google analytics, which falls back to console.log
	// outside the browser.
	var log = console.log;
	console.log = function() {};
	try {
		app.load(stats);
	} finally {
		console.log = log;
	}
	return app.stats;
}

function module_(id, chunks) {
	return {
		id: id,
		identifier: "/m" + id + ".js",
		name: "./m" + id + ".js",
		size: 100,
		chunks: chunks
	};
}

test("reads a stats file written with chunks: false", function() {
	// webpack leaves the chunks out but still names them on every module,
	// which is what used to throw on "parents of undefined".
	var stats = load({
		modules: [module_(1, [0]), module_(2, [1])]
	});
	assert.deepStrictEqual(stats.chunks, []);
	assert.deepStrictEqual(stats.modules[0].chunks, [0], "the ids are kept");
	assert.strictEqual(app.mapChunks[0], undefined, "and lead nowhere");
});

test("survives a chunk whose parent is not in the file", function() {
	var stats = load({
		modules: [module_(1, [1])],
		chunks: [
			{ id: 1, size: 100, parents: [7], names: ["main"], files: ["main.js"] }
		]
	});
	assert.deepStrictEqual(stats.chunks[0].children, [], "nothing to link to");
	assert.deepStrictEqual(stats.chunks[0].parents, [7], "the id is kept");
});

test("fills in the chunk fields a stats file can omit", function() {
	var stats = load({ modules: [], chunks: [{ id: 0, size: 10 }] });
	var chunk = stats.chunks[0];
	assert.deepStrictEqual(chunk.parents, []);
	assert.deepStrictEqual(chunk.origins, []);
	assert.deepStrictEqual(chunk.names, []);
	assert.deepStrictEqual(chunk.files, []);
	assert.deepStrictEqual(chunk.children, []);
});

test("fills in the module fields a stats file can omit", function() {
	var stats = load({
		modules: [{ id: 1, identifier: "/m1.js", name: "./m1.js", size: 100 }]
	});
	assert.deepStrictEqual(stats.modules[0].chunks, []);
	assert.deepStrictEqual(stats.modules[0].reasons, []);
	assert.deepStrictEqual(stats.modules[0].dependencies, []);
});

test("reads a stats file with nothing in it at all", function() {
	var stats = load({});
	assert.deepStrictEqual(stats.modules, []);
	assert.deepStrictEqual(stats.chunks, []);
	assert.deepStrictEqual(stats.assets, []);
});
