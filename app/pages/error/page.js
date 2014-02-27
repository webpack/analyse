module.exports = function(err, page) {
	document.title = "error";
	$(".page").html(require("./error.jade")({
		err: err,
		page: page
	}));
};