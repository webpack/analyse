module.exports = function formatSize(s) {
	if(s < 2048)
		return s + " bytes";
	s /= 1024
	if(s < 2048)
		return Math.round(s) + " KiB";
	s /= 1024
	return Math.round(s) + " MiB";
}