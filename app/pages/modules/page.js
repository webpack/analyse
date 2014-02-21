var app = require("../../app");
var sigma = require("sigma.js");
var findById = require("../../findById");
var percentageToColor = require("../../percentageToColor");

module.exports = function() {
	$(".page").html(require("./modules.jade")({
		stats: app.stats
	}));
	process.nextTick(function() {
		var nodes = [];
		var edges = [];
		var moduleCount = app.stats.modules.length;
		var chunkCount = app.stats.chunks.length;
		app.stats.modules.forEach(function(module) {
			nodes.push({
				id: "module" + module.id,
				type: "webpack",
				size: 10,
				label: "[" + module.id + "] " + module.name,
				shortLabel: "" + module.id,
				x: module.id * 1,
				y: Math.abs(moduleCount / 2 - module.id) * 2,
				color: percentageToColor(((module.chunks[0] || -1) + 1) / (chunkCount + 1))
			});
		});
		app.stats.modules.forEach(function(module) {
			var done = {};
			var uniqueReasons = module.reasons.filter(function(reason) {
				var parent = reason.moduleId;
				if(done["$"+parent]) return false;
				done["$"+parent] = true;
				return true;
			});
			uniqueReasons.forEach(function(reason) {
				var parent = reason.moduleId;
				var parentModule = findById(app.stats.modules, parent);
				var weight = 1 / uniqueReasons.length;
				edges.push({
					id: "edge" + module.id + "-" + parent,
					source: "module" + parent,
					target: "module" + module.id,
					arrow: "target",
					type: "arrow",
					size: weight,
					weight: weight
				});
			});
		});
		var s = new sigma({
			graph: {
				nodes: nodes,
				edges: edges
			},
			container: "sigma",
			settings: {
				edgeColor: "target",
				maxNodeSize: 4,
				minNodeSize: 4,
				maxEdgeSize: 2,
				minEdgeSize: 1
			}
		});
		s.startForceAtlas2();
	});

};