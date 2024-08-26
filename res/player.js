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

	this.sightRadius = 4;

	this.init({
		health: 77, //luck for player
		maxAttack: 2
	});

	this.steps = 0;
	this.maxDepth = 0;
	this.hasLamp = false;
	this.hasHorseshoe = false;
	this.luckyCharms = 0;
	this.luckyMushrooms = 0;
	this.luckyMushroomTimeout = 0;
	this.blind = false;
	this.blindTimeout = 0;
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
		this.hasLamp ? 'a flashlight' : '',
		this.hasHorseshoe ? 'a horseshoe' : ''
	].filter(function (entry) {
		return entry;
	}).join(', ');
	document.getElementById('inv').innerHTML = inv ? ('You have: ' + inv) : '';
};

Player.prototype.getHint = function () {
	//TODO
	var missed = [
		this.missedEarlyLuckyCharms ? (this.missedEarlyLuckyCharms + ' lucky charm(s)') : '',
		this.hasLamp ? '' : 'a flashlight',
		this.hasHorseshoe ? '' : 'a horseshoe'
	].filter(function (entry) {
		return entry;
	}).join(', ');
	return missed ? ('You should go back, there are useful things above you did not find yet: ' + missed) : 'Well done so far! Now find and defeat Lord Balsekil who has the third lucky charm.';
};

Player.prototype.getResult = function () {
	var experience = this.experience, points;
	if (this.luckyMushroomTimeout) {
		experience /= 2;
	}
	experience = Math.round(100 * (experience - 1));
	points = this.luckyCharms * 1000 + (this.maxDepth + 1) * 50 + Math.round(experience / 2) + this.health;
	return 'After ' + this.steps + ' steps you found ' + this.luckyCharms + ' lucky charms, reached a depth of ' + (this.maxDepth + 1) + ', and increased your experience by ' + experience + ' %. For this you earn ' + points + ' points.';
};

function bresenham (x0, y0, x1, y1, isOpen) {
	var x = x0,
		y = y0,
		dx = Math.abs(x1 - x0),
		sx = x0 < x1 ? 1 : -1,
		dy = -Math.abs(y1 - y0),
		sy = y0 < y1 ? 1 : -1,
		e = dx + dy, e2;
	while (x !== x1 || y !== y1) {
		if (!isOpen(x, y)) {
			return false;
		}
		e2 = e * 2;
		if (e2 > dy) {
			e += dy;
			x += sx;
		}
		if (e2 < dx) {
			e += dx;
			y += sy;
		}
	}
	return true;
}

Player.prototype.canSee = function (x, y) {
	var dx = x - this.x, dy = y - this.y, level = this.level;
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
	return bresenham(this.x, this.y, x, y, function (x1, y1) {
		return level.isOpen(x1, y1) || (x === x1 && y === y1);
	});
};

Player.prototype.handleItem = function (type) {
	var msg, take = false;
	//TODO add fortune cookies with general hints?
	if (type === '<') {
		if (Math.random() < 0.3) {
			log('you accidentally walked below the ladder.');
			this.reduceHealth(2);
		}
	} else if (type === '%') {
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
		if (this.level.depth < 2) {
			this.missedEarlyLuckyCharms--;
		}
		this.luckyCharms++;
		take = true;
		log('you found a lucky charm.');
	} else if (type === 'F') {
		this.luckyMushrooms++;
		take = true;
		log('you found a lucky mushroom' + (this.luckyMushrooms === 1 ? ', which you can eat to make you very strong for a short time' : '') + '.');
	} else if (type === '(') {
		take = true;
		this.hasLamp = true;
		if (!this.blind) {
			this.sightRadius = 6;
		}
		log('you found a flashlight.');
	} else if (type === ')') {
		take = true;
		this.hasHorseshoe = true;
		this.minAttack = 2;
		this.maxAttack = 4;
		log('you found a horseshoe. From now on you will use it for attacks (it will return like a boomerang), and to defend attacks (but only if you did not just throw it).');
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

Player.prototype.makeBlind = function () {
	if (this.blindTimeout === 0) {
		this.blind = true;
		this.sightRadius = 1.5;
		log('you can hardly see!');
	}
	this.blindTimeout += Math.floor(6 + Math.random() * 8);
};

Player.prototype.handleTimeouts = function () {
	if (this.luckyMushroomTimeout > 0) {
		this.luckyMushroomTimeout--;
		if (this.luckyMushroomTimeout === 0) {
			this.experience /= 2;
			log('you feel normal again.');
		}
	}
	if (this.blindTimeout > 0) {
		this.blindTimeout--;
		if (this.blindTimeout === 0) {
			this.sightRadius = this.hasLamp ? 6 : 4;
			log('your eyes are better again.');
		}
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
		this.maxDepth = Math.max(this.maxDepth, this.level.depth);
		return true;
	}
};

return Player;
})();