// Checks the ordering rules behind the sortable table columns. The clicking
// and the row shuffling need a browser; what a cell is worth and how two of
// them compare does not, and that is where the surprises live.
var test = require("node:test");
var assert = require("node:assert");

var sortableTable = require("../app/sortableTable");
var valueFrom = sortableTable.valueFrom;
var compare = sortableTable.compare;

test("reads a cell as a number when it is one", function() {
	assert.strictEqual(valueFrom("1846"), 1846);
	assert.strictEqual(valueFrom(" 12 "), 12);
	assert.strictEqual(valueFrom("0"), 0);
});

test("reads anything else as text, case aside", function() {
	assert.strictEqual(valueFrom("./SRC/App.js"), "./src/app.js");
	// The size column is printed, not measured, here: it sorts on the
	// data-sort number the template writes, never on "4 KiB".
	assert.strictEqual(valueFrom("4 KiB"), "4 kib");
	assert.strictEqual(valueFrom(""), "");
	assert.strictEqual(valueFrom(null), "");
});

test("orders numbers by size, not by their digits", function() {
	var sizes = [41, 1846, 205, 28672].sort(compare);
	assert.deepStrictEqual(sizes, [41, 205, 1846, 28672]);
});

test("orders text alphabetically", function() {
	var names = ["./b.js", "./a.js", "./c.js"].sort(compare);
	assert.deepStrictEqual(names, ["./a.js", "./b.js", "./c.js"]);
});

test("keeps cells that hold neither out of the numbers", function() {
	// A chunk with no module list prints "N/A" and sorts with an empty value;
	// it belongs at one end of the column rather than in the middle of it.
	var mixed = [12, "", 3, "n/a"].sort(compare);
	assert.deepStrictEqual(mixed, [3, 12, "", "n/a"]);
});

test("compares equal values as equal, so a sort stays stable", function() {
	assert.strictEqual(compare(7, 7), 0);
	assert.strictEqual(compare("a", "a"), 0);
});
