var app = require("../../app");
var findById = require("../../findById");

module.exports = function() {
	var multiRefs = [];
	app.stats.modules.forEach(function(module) {
		var requiresSum = {};
		module.dependencies.forEach(function(d) {
			if(!requiresSum[d.moduleId])
				requiresSum[d.moduleId] = {
					module: module,
					count: 1,
					otherModule: findById(app.stats.modules, d.moduleId)
				};
			else
				requiresSum[d.moduleId].count++;
		});
		Object.keys(requiresSum).forEach(function(id) {
			var item = requiresSum[id];
			if(item.count >= 2)
				multiRefs.push(item);
		});
	});
	multiRefs.forEach(function(item) {
		var refModLength = (item.otherModule.id+"").length;
		item.saving = item.count * (2 + refModLength) - 6 - refModLength;
	});
	multiRefs = multiRefs.filter(function(item) {
		return item.saving > 0;
	});
	multiRefs.sort(function(a, b) {
		return b.saving - a.saving;
	});

	var multiChunks = [];
	app.stats.modules.forEach(function(module) {
		if(module.chunks.length >= 2) {
			multiChunks.push({
				module: module,
				count: module.chunks.length,
				saving: ((module.chunks.length - 1) * module.size)
			});
		}
	});
	multiChunks.sort(function(a, b) {
		return b.saving - a.saving;
	});

	$(".page").html(require("./hints.jade")({
		stats: app.stats,
		multiRefs: multiRefs,
		multiChunks: multiChunks
	}));
};