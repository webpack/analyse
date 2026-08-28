// Checks the circular dependency detection against the sample stats in
// app/pages/upload/example3.json, which is also loadable in the UI as the
// "hint test cases" example. Run with `npm test`, which CI runs before the
// build.
var test = require("node:test");
var assert = require("node:assert");

var app = require("../app/app");
var findCircularDependencies = require("../app/findCircularDependencies");
var stats = require("../app/pages/upload/example3.json");

// The stats are run through the same normalization the app uses, so the test
// covers the way reasons are turned into dependencies as well. Loading reports
// to google analytics, which falls back to console.log outside the browser.
var log = console.log;
console.log = function() {};
app.load(stats);
console.log = log;

var modules = app.stats.modules;

// Every call passes its limits explicitly. The defaults are what the hints
// page settles for, not part of what is checked here, so changing them must
// not decide whether these assertions hold.
var NO_LIMIT = { maxCycles: 100, maxSteps: 100000 };
var result = findCircularDependencies(modules, NO_LIMIT);

function moduleByName(name) {
	return modules.filter(function(module) {
		return module.name === name;
	})[0];
}

function cycleNames(cycle) {
	return cycle.modules
		.map(function(module) {
			return module.name;
		})
		.join(" -> ");
}

test("finds every cycle of the sample stats, shortest first", function() {
	assert.deepStrictEqual(result.cycles.map(cycleNames), [
		"./src/self.js",
		"./src/a.js -> ./src/b.js",
		"./src/lazy-a.js -> ./src/lazy-b.js",
		"./src/hub.js -> ./src/alpha.js",
		"./src/c.js -> ./src/d.js -> ./src/e.js",
		"./src/hub.js -> ./src/beta.js -> ./src/gamma.js"
	]);
	assert.strictEqual(result.truncated, false);
});

test("counts the modules and the groups they form", function() {
	// a + b, c + d + e, self, lazy-a + lazy-b, hub + alpha + beta + gamma
	assert.strictEqual(result.moduleCount, 12);
	assert.strictEqual(result.componentCount, 5);
});

test("reports the dependency that closes each step of a cycle", function() {
	result.cycles.forEach(function(cycle) {
		var names = cycleNames(cycle);
		cycle.modules.forEach(function(module, idx) {
			var next = cycle.modules[(idx + 1) % cycle.modules.length];
			var dependency = cycle.dependencies[idx];
			assert.strictEqual(dependency.moduleUid, next.uid, names);
			assert.ok(module.dependencies.indexOf(dependency) >= 0, names);
		});
	});
});

test("records type, request and location of each import", function() {
	var cycle = result.cycles[1];
	assert.deepStrictEqual(
		cycle.dependencies.map(function(dependency) {
			return (
				dependency.type + " " + dependency.userRequest + " @" + dependency.loc
			);
		}),
		[
			"harmony side effect evaluation ./b @1:0-24",
			"harmony import specifier ./a @1:0-26"
		]
	);
});

test("reports a cycle that is closed by a dynamic import", function() {
	var cycle = result.cycles[2];
	assert.deepStrictEqual(
		cycle.dependencies.map(function(dependency) {
			return dependency.type;
		}),
		["import()", "harmony import specifier"]
	);
});

test("uses the first of several references to a module", function() {
	// c.js requires d.js twice, at 1:10-24 and at 3:31-45.
	var cycle = result.cycles[4];
	assert.strictEqual(cycle.dependencies[0].loc, "1:10-24");
});

test("ignores the reasons a module has for referring to itself", function() {
	var noise = ["./src/noise-exports.js", "./src/noise-decorator.js"];
	noise.forEach(function(name) {
		var module = moduleByName(name);
		// The sample stats do contain such a reason for these modules, so this
		// checks that the detection drops them, not that the fixture is quiet.
		assert.ok(
			module.dependencies.some(function(dependency) {
				return dependency.moduleUid === module.uid;
			}),
			name + " should depend on itself in the loaded stats"
		);
		assert.ok(
			!result.cycles.some(function(cycle) {
				return cycle.modules.indexOf(module) >= 0;
			}),
			name + " should not be reported as a cycle"
		);
	});
});

test("leaves out modules that are not part of a cycle", function() {
	var reported = {};
	result.cycles.forEach(function(cycle) {
		cycle.modules.forEach(function(module) {
			reported[module.name] = true;
		});
	});
	[
		"./src/index.js",
		"./src/utils.js",
		"./src/shared.js",
		// dangling.js has a reason from a module that is not in the stats.
		"./src/dangling.js"
	].forEach(function(name) {
		assert.ok(!reported[name], name + " is not part of a cycle");
	});
});

test("stops after the requested number of cycles", function() {
	var limited = findCircularDependencies(modules, {
		maxCycles: 2,
		maxSteps: NO_LIMIT.maxSteps
	});
	assert.strictEqual(limited.cycles.length, 2);
	assert.strictEqual(limited.truncated, true);
	// The counts describe the whole graph, not only the reported cycles.
	assert.strictEqual(limited.moduleCount, result.moduleCount);
	assert.strictEqual(limited.componentCount, result.componentCount);
});

test("stops when the search budget is used up", function() {
	var limited = findCircularDependencies(modules, {
		maxCycles: NO_LIMIT.maxCycles,
		maxSteps: 1
	});
	assert.strictEqual(limited.truncated, true);
});

test("handles stats without any module", function() {
	assert.deepStrictEqual(findCircularDependencies([], NO_LIMIT), {
		cycles: [],
		truncated: false,
		moduleCount: 0,
		componentCount: 0
	});
});
