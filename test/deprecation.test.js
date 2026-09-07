// The deprecation notice is the one thing every visitor has to see, and it
// lives in a partial two shells include. Run with `npm test`.
var test = require("node:test");
var assert = require("node:assert");
var path = require("node:path");
var pug = require("pug");

var shells = {
	upload: { file: "app/pages/upload/application.pug", locals: {} },
	select: { file: "app/pages/select/application.pug", locals: { children: [] } }
};

Object.keys(shells).forEach(function(name) {
	test("the " + name + " shell carries the deprecation notice", function() {
		var shell = shells[name];
		var html = pug.renderFile(
			path.join(__dirname, "..", shell.file),
			shell.locals
		);
		assert.match(html, /webpack analyse is deprecated/);
		assert.match(
			html,
			/https:\/\/github\.com\/webpack\/webpack-bundle-analyzer/,
			"and points at what replaces it"
		);
	});
});
