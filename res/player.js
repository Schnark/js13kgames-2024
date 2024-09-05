/*global Player: true*/
/*global MonsterBase, log, sound*/
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
	var inv = document.getElementById('inv').childNodes;
	if (this.hasHorseshoe) {
		inv[0].style.display = '';
	}
	if (this.hasLamp) {
		inv[1].style.display = '';
	}
	if (this.luckyCharms) {
		inv[2].style.display = '';
		inv[3].textContent = '×' + this.luckyCharms;
	}
	if (this.luckyMushrooms) {
		inv[4].style.display = '';
		inv[5].textContent = '×' + this.luckyMushrooms;
	} else {
		inv[4].style.display = 'none';
		inv[5].textContent = '';
	}
};

Player.prototype.getHint = function () {
	var a = 'You should go back and get the ', b = ' before proceeding further.';
	if (!this.hasHorseshoe) {
		return a + 'horseshoe' + b;
	}
	if (!this.hasLamp) {
		return a + 'flashlight' + b;
	}
	if (this.elc[0] === 1) {
		return a + 'lucky charm' + b;
	}
	if (this.elc[0]) {
		return a + this.elc[0] + ' lucky charms' + b;
	}
	return 'Well done so far! Now find the remaining lucky charms, ' +
		'and find and defeat Lord Balsekil who has the seventh lucky charm.';
};

Player.prototype.getResult = function () {
	var experience = this.experience, points;
	if (this.luckyMushroomTimeout) {
		experience /= 2;
	}
	experience = Math.round(100 * (experience - 1));
	points = this.luckyCharms * 1000 + (this.maxDepth + 1) * 50 + Math.round(experience / 2) + this.health;
	return 'After ' + this.steps + ' steps you found ' +
		(this.luckyCharms === 1 ? 'one lucky charm' : (this.luckyCharms || 'no') + ' lucky charms') +
		', reached a depth of ' + (this.maxDepth + 1) +
		', and increased your experience by ' + experience + ' %. For this you earn ' + points + ' points.';
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
	var msg, take = false,
		cookies = [
			'Never throw your horseshoe at a mirror monster!',
			'Beware of crows, they are fast and can blind you for some time!',
			'Try to get rid of as many of Lord Balsekil’s henchmen as possible before you finally meet him!',
			'Avoid ladders up unless you really have to use them.',
			'Balsekil is Volapük and means thirteen.',
			'The highest possible score is 7777.',
			'Thank you for playing!'
	];
	if (type === '>' && this.level.depth === 0) {
		log('you found the ladder down to the second level.');
	} else if (type === '<') {
		if (Math.random() < 0.3) {
			log('you accidentally walked below the ladder.', 'b');
			this.reduceHealth(2);
			sound('hit');
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
		if (this.level.depth < this.elc[1]) {
			this.elc[0]--;
		}
		this.luckyCharms++;
		take = true;
		log('you found a lucky charm.', 'b');
	} else if (type === 'F') {
		this.luckyMushrooms++;
		take = true;
		log(
			'you found a lucky mushroom' +
			(this.luckyMushrooms === 1 ? ', which you can eat to make you very strong for a short time' : '') + '.',
			this.luckyMushrooms === 1 ? 'b' : ''
		);
	} else if (type === '(') {
		take = true;
		this.hasLamp = true;
		if (!this.blind) {
			this.sightRadius = 6;
		}
		log('you found a flashlight.', 'b');
	} else if (type === ')') {
		take = true;
		this.hasHorseshoe = true;
		this.minAttack = 2;
		this.maxAttack = 4;
		log(
			'you found a horseshoe. From now on you will use it for attacks (it will return like a boomerang), ' +
			'and to defend against attacks (but only if you did not just throw it).',
			'b'
		);
	} else if (type === '?') {
		take = true;
		log(
			'you found a fortune cookie. It tastes delicious and has a paper inside: ' +
			cookies[Math.floor(Math.random() * cookies.length)],
			'b'
		);
	}
	if (take) {
		sound('item');
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
		log('you feel very strong!', 'b');
		sound('strong');
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
			log('you feel normal again.', 'b');
			sound('weak');
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