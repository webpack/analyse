var app = require("../../app");

module.exports = function() {
	var nextPage = Array.prototype.slice.call(arguments);
	document.title = "upload";
	$("body").html(require("./application.pug")());
	$(".modal").modal({ show: true });
	$("#file").change(loadFromFile);
	$("#example1").click(() => loadFromExample(1));
	$("#example2").click(() => loadFromExample(2));

	function loadFromExample(n) {
		import(`./example${n}.json`).then(function(exampleModule) {
			var example = exampleModule.default;
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
