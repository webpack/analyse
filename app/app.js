exports.stats = null;
exports.mapModules = null;
exports.mapChunks = null;

var lastPage;

function loadPage(name) {
	if(!name) name = "home";
	var pageBundle;
	var args = Array.prototype.slice.call(arguments, 1);
	if(!exports.stats) {
		args.unshift(name);
		name = "upload";
	}
	try {
		pageBundle = require("bundle!./pages/" + name + "/page.js");
	} catch(err) {
		pageBundle = function(cb) {
			cb(require("./pages/error/page.js"));
		};
		args.unshift(err, name);
	}
	pageBundle(function(page) {
		$(function() {
			if(lastPage) lastPage();
			lastPage = page.apply(null, args);
		});
	});
}
exports.loadPage = loadPage;


function load(stats) {
	stats.assets.sort(function(a, b) {
		return b.size - a.size;
	});
	stats.modules.sort(function(a, b) {
		return a.id - b.id;
	});
	var mapModules = {};
	stats.modules.forEach(function(module) {
		mapModules[module.id] = module;
		module.dependencies = [];
	});
	var mapChunks = {};
	stats.chunks.forEach(function(chunk) {
		mapChunks[chunk.id] = chunk;
		chunk.children = [];
	});
	stats.modules.forEach(function(module) {
		module.reasons.forEach(function(reason) {
			var m = mapModules[reason.moduleId];
			m.dependencies.push({
				type: reason.type,
				moduleId: module.id,
				module: module.name,
				userRequest: reason.userRequest,
				loc: reason.loc
			});
		});
	});
	stats.chunks.forEach(function(chunk) {
		chunk.parents.forEach(function(parent) {
			var c = mapChunks[parent];
			c.children.push(chunk.id);
		});
	});
	stats.modules.forEach(function(module) {
		module.dependencies.sort(function(a, b) {
			if(!a.loc && !b.loc) return 0;
			if(!a.loc) return 1;
			if(!b.loc) return -1;
			a = a.loc.split(/[:-]/);
			b = b.loc.split(/[:-]/);
			if(+a[0] < +b[0]) return -1;
			if(+a[0] > +b[0]) return 1;
			if(+a[1] < +b[1]) return -1;
			if(+a[1] > +b[1]) return 1;
			return 0;
		});
	});
	exports.stats = stats;
	exports.mapChunks = mapChunks;
	exports.mapModules = mapModules;
}
exports.load = load;