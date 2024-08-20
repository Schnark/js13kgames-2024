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

/*Tile.prototype.getType = function () {
	return this.type;
};

Tile.prototype.takeItem = function () {
	this.type = ' ';
};*/

return Tile;
})();