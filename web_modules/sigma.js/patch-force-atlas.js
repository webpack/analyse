module.exports = function(source) {
	this.cacheable();
	return source.replace(/\.mass\/Math\.pow\(([a-z]+),2\)/g, ".mass/Math.pow($1,3)");
}