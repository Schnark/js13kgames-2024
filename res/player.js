/*global Player: true*/
/*global MonsterBase, log*/
Player =
(function () {
"use strict";

function Player (dungeon) {
	this.type = '@';
	this.isPlayer = true;
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
	this.luckyMushrooms = 0;
	this.luckyMushroomTimeout = 0;
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

Player.prototype.showInv = function () {
	var inv;
	inv = [
		this.luckyCharms ? (this.luckyCharms + ' lucky charm(s)') : '',
		this.luckyMushrooms ? ('<span class="mushroom">' + this.luckyMushrooms + ' lucky mushroom(s)</span>') : '',
		this.sightRadius === 5 ? 'a lamp' : ''
	].filter(function (entry) {
		return entry;
	}).join(', ');
	document.getElementById('inv').innerHTML = inv ? ('You have: ' + inv) : '';
};

Player.prototype.getHint = function () {
	//TODO this is wrong because it also counts a charm found on the third level
	//but as for now it only is a placeholder I don't really care
	return [
		'You should go back, there are two lucky charms above.',
		'You should go back, there is one lucky charm above.',
		'Well done so far! Now find the third lucky charm.'
	][this.luckyCharms];
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

Player.prototype.handleItem = function (type) {
	var msg, take = false;
	if (type === '%') {
		msg = 'you found a four-leave clover, ';
		if (this.health === this.maxHealth) {
			msg += 'but you leave it here for later.';
		} else {
			take = true;
			this.health += 7;
			if (this.health > this.maxHealth) {
				this.health = this.maxHealth;
			}
			msg += 'which' + (this.health === this.maxHealth ? '' : ' partially') + ' restores your luck.';
		}
		log(msg);
	} else if (type === '*') {
		this.luckyCharms++;
		take = true;
		log('you found a lucky charm.');
	} else if (type === 'F') {
		this.luckyMushrooms++;
		take = true;
		log('you found a lucky mushroom' + (this.luckyMushrooms === 1 ? ', which you can eat to make you very strong for a short time' : '') + '.');
	} else if (type === '(') {
		take = true;
		this.sightRadius = 5;
		log('you found a lamp.');
	}
	if (take) {
		this.showInv();
	}
	return take;
};

Player.prototype.eat = function () {
	if (this.luckyMushrooms === 0) {
		return false;
	}
	this.luckyMushrooms--;
	this.showInv();
	if (this.luckyMushroomTimeout === 0) {
		this.experience *= 2;
		log('you feel very strong!');
	}
	this.luckyMushroomTimeout += Math.floor(4 + Math.random() * 5); //will be decreased immediately
	return true;
};

Player.prototype.handleMushroomTimeout = function () {
	if (this.luckyMushroomTimeout === 0) {
		return;
	}
	this.luckyMushroomTimeout--;
	if (this.luckyMushroomTimeout === 0) {
		this.experience /= 2;
		log('you feel normal again.');
	}
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