/*global Canvas: true*/
/*global SPRITE_URL*/
Canvas =
(function () {
"use strict";

var SPRITE_COUNT = 19, ANIMATION_DURATION = 200;

function Canvas () {
	this.canvas = document.getElementById('canvas');
	this.ctx = this.canvas.getContext('2d', {alpha: false});
	this.cover = document.getElementById('cover');
	this.coverCtx = this.cover.getContext('2d');
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
		this.prepareInv();
		callback();
	}.bind(this);
	img.src = SPRITE_URL;
};

Canvas.prototype.prepareInv = function () {
	var inv = document.getElementById('inv'), el;
	el = this.sprites[7];
	el.style.display = 'none';
	el.title = 'horseshoe';
	inv.appendChild(el);
	el = this.sprites[8];
	el.style.display = 'none';
	el.title = 'flashlight';
	inv.appendChild(el);
	el = this.sprites[6];
	el.style.display = 'none';
	el.title = 'lucky charm';
	inv.appendChild(el);
	inv.appendChild(document.createElement('span'));
	el = this.sprites[4];
	el.style.display = 'none';
	el.title = 'lucky mushroom';
	el.className = 'mushroom';
	inv.appendChild(el);
	el = document.createElement('span');
	el.className = 'mushroom';
	inv.appendChild(el);
};

Canvas.prototype.setSize = function (w, h) {
	var w0 = w * 16, h0 = h * 16,
		f, w1, h1;
	f = Math.max(1, Math.min((window.innerWidth - 20) / w0, (window.innerHeight - 80) / h0));
	w1 = (w0 * f) + 'px';
	h1 = (h0 * f) + 'px';
	if (this.canvas.width !== w0) {
		this.canvas.width = w0;
		this.canvas.height = h0;
		this.cover.width = w0;
		this.cover.height = h0;
	}
	if (this.f !== f) {
		this.f = f;
		this.canvas.style.width = w1;
		this.canvas.style.height = h1;
		this.cover.style.width = w1;
		this.cover.style.height = h1;
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