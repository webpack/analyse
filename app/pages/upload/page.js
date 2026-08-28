var app = require("../../app");

module.exports = function() {
	var nextPage = Array.prototype.slice.call(arguments);
	document.title = "upload";
	$("body").html(require("./application.pug")());
	$(".modal").modal({ show: true });
	$("#file").change(loadFromFile);
	// The examples are numbered in the order they were added, not by the
	// webpack version each one was written for. This is the order the modal
	// lists them in. example3.json is not listed, it is the fixture the
	// circular dependency test runs on.
	[1, 4, 5, 6, 2].forEach(n =>
		$("#example" + n).click(() => loadFromExample(n))
	);

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
