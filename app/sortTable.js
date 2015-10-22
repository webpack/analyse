module.exports = function sortTable(colNumber) {
	var table = document.querySelectorAll('tbody')[1];
	var	sizeKey = 'data-size-' + colNumber;
	var	sortKey = 'data-sort-desc-' + colNumber;

	// Sort table desc initially, then alternate
	if (!table.hasAttribute(sortKey)) {
		table.setAttribute(sortKey, 1);
	}
	var sortDesc = parseInt(table.getAttribute(sortKey), 0);
	if (sortDesc) {
		table.setAttribute(sortKey, 0);
	} else {
		table.setAttribute(sortKey, 1);
	}

	Array.prototype.slice.apply(table.querySelectorAll('tr')).forEach(function (el) {
		var size = el.querySelector('td:nth-of-type(' + colNumber + ')').innerHTML;
		var num = origNum = parseInt(size,0);
		if (size.indexOf('KiB') > -1) {
			num = num * 1024;
		} else if (size.indexOf('MiB') > -1) {
			num = num * 1024 * 1024;
		}
		el.setAttribute(sizeKey, num);
	});

	var rows = Array.prototype.slice.apply(table.querySelectorAll('tr'));
	rows.forEach(function (row) {
		var currentSize = parseInt(row.getAttribute(sizeKey), 0);
		var moved = false;
		Array.prototype.slice.apply(table.querySelectorAll('tr')).forEach(function (irow) {
			var irowSize = parseInt(irow.getAttribute(sizeKey), 0);
			var insertBefore = sortDesc ? currentSize >= irowSize : currentSize <= irowSize; 
			if (!moved && insertBefore) {
				irow.parentNode.insertBefore(row, insertBefore ? irow : irow.nextSibling);
				moved = true;
			}
		});
	});
}