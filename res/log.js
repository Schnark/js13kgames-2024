/*global log: true*/
log =
(function () {
"use strict";

var logElement = document.getElementById('log'),
	queue = [],
	async = false;

function toggleAsync (on) {
	async = on;
}

function clearQueue () {
	queue.forEach(function (data) {
		log(data[0], data[1]);
	});
	queue = [];
}

function log (str, cls) {
	var li;
	if (async) {
		queue.push([str, cls]);
		return;
	}
	li = document.createElement('li');
	li.textContent = str.charAt(0).toUpperCase() + str.slice(1);
	li.className = cls || '';
	logElement.insertBefore(li, logElement.firstChild);
	logElement.scrollTop = 0;
}

log.async = toggleAsync;
log.clearQueue = clearQueue;

return log;
})();