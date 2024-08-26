/*global Tile: true*/
Tile =
(function () {
"use strict";

function Tile (type) {
	this.type = type;
	this.seen = false; //will be updated on draw
}

Tile.draw = {
	'.': function (ctx) {
		ctx.fillStyle = 'rgba(128,128,128,0.75)';
		ctx.fillRect(0, 0, 16, 16);
	},
	' ': function (ctx) {
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, 16, 16);
	},
	'#': function (ctx) {
		ctx.fillStyle = 'brown';
		ctx.fillRect(0, 0, 16, 16);
	},
	'>': function (ctx) {
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, 16, 16);
		ctx.strokeStyle = 'brown';
		ctx.beginPath();
		ctx.moveTo(7.5, 2);
		ctx.lineTo(7.5, 14);
		ctx.lineTo(3.5, 10);
		ctx.lineTo(11.5, 10);
		ctx.lineTo(7.5, 14);
		ctx.stroke();
	},
	'<': function (ctx) {
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, 16, 16);
		ctx.strokeStyle = 'brown';
		ctx.beginPath();
		ctx.moveTo(7.5, 14);
		ctx.lineTo(7.5, 2);
		ctx.lineTo(3.5, 6);
		ctx.lineTo(11.5, 6);
		ctx.lineTo(7.5, 2);
		ctx.stroke();
	},
	'%': function (ctx) {
		ctx.fillStyle = '#8f8';
		ctx.fillRect(0, 0, 16, 16);
	},
	'F': function (ctx) {
		ctx.fillStyle = '#f88';
		ctx.fillRect(0, 0, 16, 16);
	},
	'(': function (ctx) {
		ctx.fillStyle = '#ff0';
		ctx.fillRect(0, 0, 16, 16);
	},
	'*': function (ctx) {
		ctx.fillStyle = '#f0f';
		ctx.fillRect(0, 0, 16, 16);
	},
	')': function (ctx) {
		ctx.fillStyle = '#f80';
		ctx.fillRect(0, 0, 16, 16);
	}
};

Tile.prototype.draw = function (canvas, currentlySeen) {
	if (currentlySeen) {
		this.seen = true;
	}
	if (!this.seen) {
		return;
	}
	Tile.draw[this.type](canvas.ctx);
	//TODO for walls cover unseen parts?
	if (!currentlySeen) {
		Tile.draw['.'](canvas.ctx);
	}
};

//whether we can walk on and look through this tile
Tile.prototype.isOpen = function () {
	return this.type !== '#';
};

Tile.prototype.isSeen = function () {
	return this.seen;
};

Tile.prototype.getType = function () {
	return this.type;
};

//also used to drop an item
Tile.prototype.takeItem = function (c) {
	this.type = c || ' ';
};

return Tile;
})();