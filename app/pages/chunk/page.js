var app = require("../../app");

module.exports = function(id) {
	id = parseInt(id, 10);
	$(".page").html(require("./chunk.jade")({
		stats: app.stats,
		id: id,
		chunk: app.mapChunks[id]
	}));
};