exports.stats = null;
exports.mapModules = null;
exports.mapChunks = null;

function load(stats) {
	stats.assets.sort(function(a, b) {
		return b.size - a.size;
	});
	stats.modules.sort(function(a, b) {
		return a.id - b.id;
	});
	var mapModules = {};
	var mapModulesIdent = {};
	var mapModulesUid = {};
	stats.modules.forEach(function(module, idx) {
		mapModules[module.id] = module;
		mapModulesIdent["$"+module.identifier] = module;
		mapModulesUid[module.uid = idx] = module;
		module.dependencies = [];
	});
	var mapChunks = {};
	var dependencySizeCache = {};
	stats.chunks.forEach(function(chunk) {
		mapChunks[chunk.id] = chunk;
		chunk.children = [];
	});
	stats.modules.forEach(function(module) {
		module.reasons.forEach(function(reason) {
			var m = mapModulesIdent["$"+reason.moduleIdentifier];
			if(!m) return;
			reason.moduleUid = m.uid;
			m.dependencies.push({
				type: reason.type,
				moduleId: module.id,
				moduleUid: module.uid,
				module: module.name,
				userRequest: reason.userRequest,
				loc: reason.loc
			});
		});
		module.issuerUid = mapModulesIdent["$"+module.issuer] && mapModulesIdent["$"+module.issuer].uid;
		(function setTimestamp(module) {
			if(typeof module.timestamp === "number") return module.timestamp;
			if(!module.profile) return;
			var factory = module.profile.factory || 0;
			var building = module.profile.building || 0;
			module.time = factory + building;
			if(!module.issuer) return module.timestamp = module.time;
			var issuer = mapModulesIdent["$"+module.issuer];
			if(!issuer) return module.timestamp = NaN;
			setTimestamp(issuer);
			module.timestamp = issuer.timestamp + module.time;
		}(module));
	});
	stats.chunks.forEach(function(chunk) {
		chunk.parents.forEach(function(parent) {
			var c = mapChunks[parent];
			c.children.push(chunk.id);
		});
		chunk.origins.forEach(function(origin) {
			var m = mapModulesIdent["$"+origin.moduleIdentifier];
			if(!m) return;
			origin.moduleUid = m.uid;
		});
		chunk.modules.forEach(function(module) {
			var m = mapModulesIdent["$"+module.identifier], s;
			if(!m) return;
			module.recursiveSize = recursiveSize(m, mapModules, dependencySizeCache);
		});
	});
	stats.modules.forEach(function(module) {
		module.recursiveSize = recursiveSize(module, mapModules, dependencySizeCache);
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
	var maxLength = 0;
	stats.assets.forEach(function(a) {
		if(a.name.length > maxLength) maxLength = a.name.length;
	});
	stats.assets.forEach(function(a) {
		a.normalizedName = a.name;
		while(a.normalizedName.length < maxLength)
			a.normalizedName = " " + a.normalizedName;
	});
	stats.assets.sort(function(a, b) {
		a = a.normalizedName;
		b = b.normalizedName;
		return a < b ? -1 : 1;
	});
	exports.stats = stats;
	exports.mapChunks = mapChunks;
	exports.mapModules = mapModules;
	exports.mapModulesUid = mapModulesUid;
	exports.mapModulesIdent = mapModulesIdent;

	var ga = require("./googleAnalytics");
	ga('set', 'dimension1', categorize(stats.modules.length) + "");
	ga('set', 'dimension2', categorize(stats.chunks.length)  + "");
	ga('set', 'dimension3', categorize(stats.assets.length)  + "");
	ga('set', 'dimension4', categorize(stats.time)           + "");
}
exports.load = load;

function categorize(number) {
	if(number <= 0) return 0;
	var factor = 1;
	do {
		if(number <= 10) return number * factor;
		factor *= 10;
		number = Math.floor(number / 10);
	} while(number > 0)
	return "";
}


// Calculate the recursive dependency size for a module
// This function has the side effect of updating a passed cache object
function recursiveSize(m, moduleMap, dependencySizeCache) {
	var depSize,
	cachedDepSize = dependencySizeCache[m.uid];
	if (cachedDepSize) {
		depSize = cachedDepSize;
	} else {
		depSize = calculateDependencySize(m, {}, moduleMap);
		dependencySizeCache[m.uid] = depSize;
	}
	return m.size + depSize;
}

function calculateDependencySize(m, traversed, moduleMap) {
	return m.dependencies.reduce(function (depSize, dep) {
		var depMod = moduleMap[dep.moduleId];
		if (!traversed[dep.moduleUid]) {
			// Mark this module as already included in the calculation
			// to avoid double-counting or circular dependencies
			traversed[dep.moduleUid] = true;
			// Add the size of this dependency...
			depSize  += depMod.size;
			// ...and all of its dependencies
			depSize += calculateDependencySize(depMod, traversed, moduleMap);
		}
		return depSize;
	}, 0);
}
