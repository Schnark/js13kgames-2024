/*global Player: true*/
/*global MonsterBase*/
Player =
(function () {
"use strict";

function Player (dungeon) {
	this.type = '@';
	this.dungeon = dungeon;
	dungeon.init(this);

	//should be odd to avoid most of the rounding problems
	this.sightRadius = 3;

	//luck for player
	this.health = 77;
	this.maxHealth = 77;
	this.experience = 1;
	this.block = 0.1;
	this.minAttack = 1;
	this.maxAttack = 3;

	this.luckyCharms = 0;
}

Player.prototype = new MonsterBase();

Player.prototype.showLuck = function () {
	if (!this.luckOutput) {
		this.luckOutput = document.getElementById('luck');
		this.luckCanvas = document.getElementById('luck-canvas').getContext('2d', {alpha: false});
		this.luckCanvas.canvas.width = 100;
		this.luckCanvas.canvas.height = 10;
	}
	this.luckOutput.style.color = this.drawHealth(this.luckCanvas, 100, 10);
	this.luckOutput.textContent = this.health + '/' + this.maxHealth;
};

//TODO improve
Player.prototype.canSee = function (x, y) {
	var dx = x - this.x, dy = y - this.y, i, x1, y1;
	//walls can be seen if the nearest corner/border can be seen, otherwise it's the center
	if (!this.level.isOpen(x, y)) {
		if (dx > 0) {
			dx -= 0.5;
		} else if (dx < 0) {
			dx += 0.5;
		}
		if (dy > 0) {
			dy -= 0.5;
		} else if (dy < 0) {
			dy += 0.5;
		}
	}
	if (dx * dx + dy * dy > this.sightRadius * this.sightRadius) {
		return false;
	}
	for (i = 0; i < this.sightRadius; i++) {
		x1 = Math.round(this.x + i * dx / this.sightRadius);
		y1 = Math.round(this.y + i * dy / this.sightRadius);
		if (x1 === x && y1 === y) {
			return true;
		}
		if (!this.level.isOpen(x1, y1)) {
			return false;
		}
	}
	return true;
};

Player.prototype.goUp = function () {
	if (this.level.getType(this.x, this.y) === '<') {
		this.dungeon.goUp(this);
		return true;
	}
};

Player.prototype.goDown = function () {
	if (this.level.getType(this.x, this.y) === '>') {
		this.dungeon.goDown(this);
		return true;
	}
};

return Player;
})();