var app = require("./app");

var lastHash = "";
window.addEventListener("hashchange", function() {
	if(location.hash !== lastHash) {
		lastHash = location.hash;
		loadPageFromHash();
	}
}, false);
loadPageFromHash();

function loadPageFromHash() {
	app.loadPage.apply(app, location.hash.replace(/^#/, "").split("/"));
}
