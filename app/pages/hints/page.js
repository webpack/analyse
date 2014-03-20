var app = require("../../app");
var findById = require("../../findById");

module.exports = function() {
	document.title = "hints";
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
		return item.saving > 10;
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
	multiChunks = multiChunks.filter(function(item) {
		return item.saving > 100;
	});
	multiChunks.sort(function(a, b) {
		return b.saving - a.saving;
	});

	var modulesByTimestamp = app.stats.modules.filter(function(m) {
		return typeof m.timestamp === "number";
	}).sort(function(a, b) {
		return b.timestamp - a.timestamp;
	}).slice(0, 10);

	var longChains = modulesByTimestamp.map(function(m) {
		var chain = [m];
		while(typeof m.issuerUid === "number") {
			m = app.mapModulesUid[m.issuerUid];
			if(!m) break;
			chain.unshift(m);
		}
		return chain;
	});

	$(".page").html(require("./hints.jade")({
		stats: app.stats,
		multiRefs: multiRefs,
		multiChunks: multiChunks,
		longChains: longChains
	}));
};