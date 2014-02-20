var app = require("../../app");

module.exports = function() {
	var nextPage = Array.prototype.slice.call(arguments);
	$("body").html(require("./application.jade")());
	$(".modal").modal({show: true});
	$("#file").change(loadFromFile);
	$("#example").click(loadFromExample);

	function loadFromExample() {
		require(["./example.json"], function(example) {
			app.load(example);
			$(".modal").modal("hide");
			app.loadPage.apply(app, nextPage);
		});
	}

	function loadFromFile() {
		alert("TODO");
	}
};
