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
	queue.forEach(function (str) {
		log(str);
	});
	queue = [];
}

function log (str) {
	var li;
	if (async) {
		queue.push(str);
		return;
	}
	li = document.createElement('li');
	li.textContent = str.charAt(0).toUpperCase() + str.slice(1);
	logElement.insertBefore(li, logElement.firstChild);
}

log.async = toggleAsync;
log.clearQueue = clearQueue;

return log;
})();