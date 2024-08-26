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

Canvas.prototype.showTarget = function (x, y, c) {
	x = x * 16 + 8;
	y = y * 16 + 8;
	this.ctx.fillStyle = 'rgba(255,255,255,0.75)';
	this.ctx.fillRect(x, y, 8, 8);
	this.ctx.font = '10px monospace';
	this.ctx.textAlign = 'center';
	this.ctx.fillStyle = '#000';
	this.ctx.fillText(c, x + 4, y + 8);
};

Canvas.prototype.clearTargets = function () {
	//TODO
};

return Canvas;
})();