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
	' ': function (ctx, sprites) {
		ctx.drawImage(sprites[0], 0, 0);
	},
	'#': function (ctx, sprites) {
		ctx.drawImage(sprites[1], 0, 0);
	},
	'>': function (ctx, sprites) {
		ctx.drawImage(sprites[2], 0, 0);
	},
	'<': function (ctx, sprites) {
		ctx.drawImage(sprites[3], 0, 0);
	},
	'F': function (ctx, sprites) {
		ctx.drawImage(sprites[0], 0, 0);
		ctx.drawImage(sprites[4], 0, 0);
	},
	'%': function (ctx, sprites) {
		ctx.drawImage(sprites[0], 0, 0);
		ctx.drawImage(sprites[5], 0, 0);
	},
	'*': function (ctx, sprites) {
		ctx.drawImage(sprites[0], 0, 0);
		ctx.drawImage(sprites[6], 0, 0);
	},
	')': function (ctx, sprites) {
		ctx.drawImage(sprites[0], 0, 0);
		ctx.drawImage(sprites[7], 0, 0);
	},
	'(': function (ctx, sprites) {
		ctx.drawImage(sprites[0], 0, 0);
		ctx.drawImage(sprites[8], 0, 0);
	},
	'?': function (ctx, sprites) {
		ctx.drawImage(sprites[0], 0, 0);
		ctx.drawImage(sprites[18], 0, 0);
	}
};

Tile.prototype.draw = function (canvas, currentlySeen) {
	if (currentlySeen) {
		this.seen = true;
	}
	if (!this.seen) {
		return;
	}
	Tile.draw[this.type](canvas.ctx, canvas.sprites);
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