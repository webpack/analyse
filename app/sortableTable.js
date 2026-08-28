// Click-to-sort for the tables of any page (webpack/analyse#28).
//
// Sorting used to live in the modules page and was written against
// app.stats.modules, which is why that was the only table that could sort, and
// only by size. This sorts the rendered rows instead, so a page only has to
// mark a column with .sortable-th, whatever shape the data behind it has.
// Cells that do not sort the way they read - a size printed as "4 KiB", an id
// that is a number inside a link - carry what to sort on in data-sort.

// Remembered per table for the pages that redraw their rows, keyed by the
// data-sort-key of the table.
var lastSort = {};

// Called by every page that has a sortable table. The handler is delegated
// from the document and installed once, so it survives the pages redrawing
// their tables and there is nothing to tear down.
var enabled = false;

exports.enable = function enable() {
	if (enabled) return;
	enabled = true;
	$(document).on("click", "th.sortable-th", function() {
		var column = $(this).index();
		var table = $(this).closest("table")[0];
		if (!table) return;
		sort(table, column, nextDirection(this));
	});
};

// A column is wanted a particular way round the first time it is clicked:
// sizes and counts biggest first, ids and names from the start. The column
// says which through data-sort-first, since guessing it from the values would
// turn an id into a countdown.
function nextDirection(th) {
	if ($(th).hasClass("sorted-desc")) return "asc";
	if ($(th).hasClass("sorted-asc")) return "desc";
	return th.getAttribute("data-sort-first") === "desc" ? "desc" : "asc";
}

function sort(table, column, direction) {
	var $table = $(table);
	var body = $table.find("tbody")[0] || table;
	var factor = direction === "asc" ? 1 : -1;
	// Array.prototype.sort is stable, so rows that compare equal stay in the
	// order the page rendered them in.
	var rows = $table.find("tbody > tr").get();
	rows.sort(function(a, b) {
		return factor * compare(valueOf(a, column), valueOf(b, column));
	});
	rows.forEach(function(row) {
		body.appendChild(row);
	});
	$table.find("th").removeClass("sorted-asc sorted-desc");
	$table
		.find("th")
		.eq(column)
		.addClass("sorted-" + direction);
	var key = table.getAttribute("data-sort-key");
	if (key) lastSort[key] = { column: column, direction: direction };
}

// Puts a redrawn table back in the order it was sorted in. Without it, typing
// in the module filter would silently undo the sort.
exports.restore = function restore(table) {
	if (!table) return;
	var key = table.getAttribute("data-sort-key");
	var last = key && lastSort[key];
	if (last) sort(table, last.column, last.direction);
};

function valueOf(row, column) {
	var cell = row.cells[column];
	if (!cell) return "";
	var raw = cell.getAttribute("data-sort");
	return exports.valueFrom(raw === null ? cell.textContent : raw);
}

// What a cell sorts as: a number when it reads as one, its text otherwise.
exports.valueFrom = function valueFrom(text) {
	text = (text || "").trim();
	if (text === "") return "";
	var number = Number(text);
	return isNaN(number) ? text.toLowerCase() : number;
};

exports.compare = compare;

function compare(a, b) {
	var aIsNumber = typeof a === "number";
	var bIsNumber = typeof b === "number";
	if (aIsNumber && bIsNumber) return a - b;
	// Numbers before text, so a cell that holds neither does not land in the
	// middle of a column of numbers.
	if (aIsNumber !== bIsNumber) return aIsNumber ? -1 : 1;
	return a < b ? -1 : a > b ? 1 : 0;
}
