/*global Canvas: true*/
/*global SPRITE_URL*/
Canvas =
(function () {
"use strict";

var SPRITE_COUNT = 18, ANIMATION_DURATION = 200;

function Canvas (id) {
	this.canvas = document.getElementById(id);
	this.ctx = this.canvas.getContext('2d', {alpha: false});
	this.cover = document.getElementById('cover');
	this.coverCtx = this.cover.getContext('2d');
	this.f = 1.5;
}

Canvas.animations = [];

Canvas.addAnimation = function (x0, y0, x1, y1, horseshoe) {
	Canvas.animations.push({x0: x0, y0: y0, x1: x1, y1: y1, h: horseshoe});
};

Canvas.prototype.loadSprites = function (callback) {
	var img = new Image();
	this.sprites = [];
	img.onload = function () {
		var i, canvas, ctx;
		for (i = 0; i < SPRITE_COUNT; i++) {
			canvas = document.createElement('canvas');
			canvas.width = 16;
			canvas.height = 16;
			ctx = canvas.getContext('2d');
			ctx.drawImage(img, i * 16, 0, 16, 16, 0, 0, 16, 16);
			this.sprites.push(canvas);
		}
		callback();
	}.bind(this);
	img.src = SPRITE_URL;
};

Canvas.prototype.setSize = function (w, h) {
	if (this.canvas.width !== w * 16) {
		this.canvas.width = w * 16;
		this.canvas.style.width = (w * 16 * this.f) + 'px';
		this.cover.width = w * 16;
		this.cover.style.width = (w * 16 * this.f) + 'px';
	}
	if (this.canvas.height !== h * 16) {
		this.canvas.height = h * 16;
		this.canvas.style.height = (h * 16 * this.f) + 'px';
		this.cover.height = h * 16;
		this.cover.style.height = (h * 16 * this.f) + 'px';
	}
};

Canvas.prototype.getTile = function (x, y) {
	var rect = this.canvas.getBoundingClientRect();
	x = (x - rect.left) / this.f;
	y = (y - rect.top) / this.f;

	x = Math.floor(x / 16);
	y = Math.floor(y / 16);

	return [x, y];
};

Canvas.prototype.showTarget = function (x, y, c) {
	x = x * 16 + 8;
	y = y * 16 + 8;
	this.coverCtx.fillStyle = 'rgba(255,255,255,0.75)';
	this.coverCtx.fillRect(x, y, 8, 8);
	this.coverCtx.font = '10px monospace';
	this.coverCtx.textAlign = 'center';
	this.coverCtx.fillStyle = '#000';
	this.coverCtx.fillText(c, x + 4, y + 8);
};

Canvas.prototype.clearTargets = function () {
	this.coverCtx.clearRect(0, 0, this.cover.width, this.cover.height);
};

Canvas.prototype.showAnimation = function (x0, y0, x1, y1, horseshoe, p) {
	var x, y, a;
	a = p * Math.PI * 4;
	if (horseshoe) {
		p = p > 0.5 ? 2 - 2 * p : 2 * p;
	}
	x = x0 + (x1 - x0) * p;
	y = y0 + (y1 - y0) * p;
	this.coverCtx.save();
	this.coverCtx.translate(x * 16 + 8, y * 16 + 8);
	this.coverCtx.rotate(a);
	this.coverCtx.drawImage(this.sprites[horseshoe ? 7 : 17], -8, -8);
	this.coverCtx.restore();
};

Canvas.prototype.runAnimations = function () {
	var rAF = window.requestAnimationFrame || window.mozRequestAnimationFrame, start, step;
	if (Canvas.animations.length === 0) {
		return;
	}

	step = function (t) {
		var i, p, data;
		if (!start) {
			start = t;
		}
		this.clearTargets();
		p = (t - start) / ANIMATION_DURATION;
		if (p <= 1) {
			for (i = 0; i < Canvas.animations.length; i++) {
				data = Canvas.animations[i];
				this.showAnimation(data.x0, data.y0, data.x1, data.y1, data.h, p);
			}
			rAF(step);
		} else {
			Canvas.animations = [];
		}
	}.bind(this);

	rAF(step);
};

return Canvas;
})();