// The way the pages reach a graph (webpack/analyse#38).
//
// Both graph modules do their work as they load: they walk every module or
// chunk, build the graphology graph, start sigma and spin up a layout worker.
// A page that requires one directly therefore pays for it whether or not the
// reader wants to see it, which is the whole problem on a large build. Going
// through here keeps that work behind settings.enabled(), and puts a control
// beside the graph so the choice can be made and remembered from the page.

var settings = require("./settings");

exports.settings = settings;

exports.modules = create(
	function() {
		return require("./modules");
	},
	"sigma-modules",
	function() {
		return settings.moduleCount() + " modules";
	}
);

exports.chunks = create(
	function() {
		return require("./chunks");
	},
	"sigma-chunks",
	function() {
		return settings.chunkCount() + " chunks";
	}
);

function create(load, containerId, describe) {
	var element = document.getElementById(containerId);
	var graph = null;
	var showing = false;
	// Built here rather than on first use so that it always ends up after the
	// legend, which the graph module inserts directly below the container when
	// it eventually loads.
	var toggle = document.createElement("div");
	toggle.className = "graph-toggle";
	toggle.style.display = "none";
	element.parentNode.insertBefore(toggle, element.nextSibling);
	$(toggle).on("click", "button", function() {
		settings.set(!settings.enabled());
	});
	// The selection the page asked for, kept so that turning the graphs back
	// on lands on the module or chunk the reader is actually looking at.
	var selection = null;

	function apply() {
		if (!showing) return;
		if (settings.enabled()) {
			// The require runs the graph module, so it only happens here.
			if (!graph) graph = load();
			graph.show();
			if (selection) graph[selection.method].apply(graph, selection.args);
		} else if (graph) {
			graph.hide();
		}
		render();
	}

	function select(method, args) {
		selection = { method: method, args: args };
		if (graph && settings.enabled()) graph[method].apply(graph, args);
	}

	function render() {
		toggle.style.display = showing ? "" : "none";
		if (!showing) return;
		var on = settings.enabled();
		toggle.textContent = "";
		var button = document.createElement("button");
		button.type = "button";
		button.className = "btn btn-default btn-xs";
		button.textContent = on ? "hide graph" : "show graph";
		toggle.appendChild(button);
		if (on) return;
		var note = document.createElement("span");
		note.className = "graph-toggle-note";
		var remembered = " The choice is remembered in this browser.";
		note.textContent = settings.tooBig()
			? "The graph is off: " +
				describe() +
				" take a long time to lay out." +
				remembered
			: "The graph is off." + remembered;
		toggle.appendChild(note);
	}

	settings.onChange(apply);

	return {
		show: function() {
			showing = true;
			apply();
		},
		hide: function() {
			showing = false;
			selection = null;
			if (graph) graph.hide();
			render();
		},
		setNormal: function() {
			select("setNormal", []);
		},
		setActiveModule: function(uid) {
			select("setActiveModule", [uid]);
		},
		setActiveChunk: function(id) {
			select("setActiveChunk", [id]);
		}
	};
}
