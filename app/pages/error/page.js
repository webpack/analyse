module.exports = function(err, page) {
	document.title = "error";
	$(".page").html(
		require("./error.pug")({
			err: err,
			page: page
		})
	);
};
