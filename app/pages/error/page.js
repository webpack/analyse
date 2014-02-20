module.exports = function(err, page) {
	$(".page").html(require("./error.jade")({
		err: err,
		page: page
	}));
};