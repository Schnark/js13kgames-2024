/*global Player: true*/
/*global MonsterBase*/
Player =
(function () {
"use strict";

function Player (x, y, level) {
	this.type = '@';
	this.x = x;
	this.y = y;
	this.level = level;

	//should be odd to avoid most of the rounding problems
	this.sightRadius = 3;

	//luck for player
	this.health = 77;
	this.maxHealth = 77;
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

return Player;
})();