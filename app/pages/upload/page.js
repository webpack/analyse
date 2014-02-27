var app = require("../../app");

module.exports = function() {
	var nextPage = Array.prototype.slice.call(arguments);
	document.title = "upload";
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
		var files = $("#file")[0].files;
		var fileReader = new FileReader();
		fileReader.readAsText(files[0]);
		fileReader.onload = function() {
			var data = fileReader.result;
			app.load(JSON.parse(data));
			$(".modal").modal("hide");
			app.loadPage.apply(app, nextPage);
		};
		fileReader.onerror = function(err) {
			alert(err);
		};
	}
};
