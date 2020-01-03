module.exports = function(str) {
	if (typeof str === "string") {
		str = str.split("\n");
		var moduleName = str.shift();
		return {
			moduleName: moduleName,
			message: str.join("\n")
		};
	} else {
		return str;
	}
};
