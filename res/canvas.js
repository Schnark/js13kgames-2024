/*global Canvas: true*/
Canvas =
(function () {
"use strict";

function Canvas (id) {
	this.canvas = document.getElementById(id);
	this.ctx = this.canvas.getContext('2d', {alpha: false});
	this.f = 1.5;
}

Canvas.prototype.setSize = function (w, h) {
	if (this.canvas.width !== w * 16) {
		this.canvas.width = w * 16;
		this.canvas.style.width = (w * 16 * this.f) + 'px';
	}
	if (this.canvas.height !== h * 16) {
		this.canvas.height = h * 16;
		this.canvas.style.height = (h * 16 * this.f) + 'px';
	}
};

Canvas.prototype.getTile = function (x, y) {
	x = (x - this.canvas.offsetLeft + document.documentElement.scrollLeft) / this.f;
	y = (y - this.canvas.offsetTop + document.documentElement.scrollTop) / this.f;

	x = Math.floor(x / 16);
	y = Math.floor(y / 16);

	return [x, y];
};

return Canvas;
})();