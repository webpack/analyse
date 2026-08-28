var app = require("../../app");
var modulesGraph = require("../../graphs/modules");
var moduleFilter = require("../../moduleFilter");
var formatSize = require("../../formatSize");

function renderTable() {
	$(".modules-table").html(
		require("./table.pug")({
			modules: app.stats.modules.filter(moduleFilter.isVisible)
		})
	);
}

function renderSummary() {
	var summary = moduleFilter.summary(app.stats.modules);
	$(".module-filter-summary").text(
		moduleFilter.isActive()
			? "showing " +
					summary.visible +
					" of " +
					summary.total +
					" modules, " +
					formatSize(summary.visibleSize) +
					" of " +
					formatSize(summary.totalSize)
			: summary.total + " modules, " + formatSize(summary.totalSize)
	);
	// An unfinished regexp is a normal thing to have in a filter box, so it is
	// reported next to the field rather than emptying the table.
	$(".module-filter-error").text(
		moduleFilter.error ? "not a valid regexp: " + moduleFilter.error : ""
	);
}

module.exports = function() {
	document.title = "modules";
	$(".page").html(
		require("./modules.pug")({
			query: moduleFilter.query,
			hideThirdParty: moduleFilter.hideThirdParty
		})
	);
	renderTable();
	renderSummary();

	var sortDir;
	$(document).on("click", ".size-th", function() {
		sortDir = sortDir === "desc" ? "asc" : "desc";
		app.stats.modules.sort(function(a, b) {
			return sortDir === "asc" ? b.size - a.size : a.size - b.size;
		});
		renderTable();
	});
	// The graph follows the same filter through moduleFilter, so only the table
	// and the summary are redrawn here.
	$(document).on("input", ".module-filter-query", function() {
		moduleFilter.set({ query: this.value });
		renderTable();
		renderSummary();
	});
	$(document).on("change", ".module-filter-third-party", function() {
		moduleFilter.set({ hideThirdParty: this.checked });
		renderTable();
		renderSummary();
	});

	modulesGraph.show();
	modulesGraph.setNormal();
	return function() {
		$(document).off("click", ".size-th");
		$(document).off("input", ".module-filter-query");
		$(document).off("change", ".module-filter-third-party");
		modulesGraph.hide();
	};
};
