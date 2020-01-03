var app = require("../../app");

module.exports = function(stats) {
	document.title = "select";
	$("body").html(require("./application.pug")(stats));
	$(".modal").modal({ show: true });
	$(".js-select").click(function() {
		var index = $(this).data("index");
		app.load(stats.children[index]);
		$(".modal").modal("hide");
		app.loadPage("home");
	});
};
