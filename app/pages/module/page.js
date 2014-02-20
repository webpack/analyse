var app = require("../../app");

module.exports = function(id) {
	id = parseInt(id, 10);
	$(".page").html(require("./module.jade")({
		stats: app.stats,
		id: id,
		module: app.mapModules[id]
	}));
};