/*global Monster: true*/
/*global MonsterBase, log*/
Monster =
(function () {
"use strict";

function Monster (type, x, y, level) {
	this.type = type;
	this.x = x;
	this.y = y;
	this.level = level;

	//updated on level draw
	this.seen = false;
	this.seenBefore = false;

	this.health = 10;
	this.maxHealth = 10;
	this.experience = 1;
	this.block = 0.1;
	this.minAttack = 1;
	this.maxAttack = 2;
}

Monster.prototype = new MonsterBase();

Monster.desc = {
	'x': ['a green monster', 'the green monster'],
	'A': ['a chimney sweep', 'the chimney sweep']
};
/*
brown newt: slow, melee only ("touch")
black crow: fast, melee only ("peck")
black cat: normal speed, ranged only ("hiss")

all three in small, normal size, large

mirror monster: normal speed, ranged only ("evil look"); will shatter immediately when hit with horseshoe, but gives much bad luck to player

henchman (13 of them): normal speed, melee and ranged ("spill salt"?)
Lord XIII (unique): normal speed, melee and ranged

chimney sweep: no attacks, gives hint

player attacks
melee: hit (with fingers crossed?)
ranged: yell lucky number, throw horseshoe (once you found one)
when horseshoe is not thrown it increases protection

items for player:
lucky charm: find all to win (7 of them?)
horseshoe: as above (unique)
lamp (unique), lucky mushroom, four-leave clover: as implemented
*/

Monster.prototype.getDesc = function (the) {
	return Monster.desc[this.type][the ? 1 : 0];
};

Monster.prototype.walkRandom = function (player) {
	var dx, dy;
	do {
		dx = Math.floor(Math.random() * 3) - 1;
		dy = Math.floor(Math.random() * 3) - 1;
	} while (!this.level.isOpen(this.x + dx, this.y + dy));
	if (
		!this.level.monsterAt(this.x + dx, this.y + dy) &&
		!(player.x === this.x + dx && player.y === this.y + dy)
	) {
		this.moveRel(dx, dy);
	}
};

Monster.prototype.huntPlayer = function (player) {
	var path = this.level.findPath(this.x, this.y, player.x, player.y);
	if (!path || path.length < 2 || this.level.monsterAt(path[1][0], path[1][1])) {
		//fist two shouldn't happen
		this.walkRandom(player);
	} else {
		this.moveRel(path[1][0] - path[0][0], path[1][1] - path[0][1]);
	}
};

Monster.prototype.meleeAI = function (player) {
	if (Math.abs(player.x - this.x) <= 1 && Math.abs(player.y - this.y) <= 1) {
		this.attack(player);
		return;
	}
	if (!this.seen) {
		this.walkRandom(player);
		return;
	}
	this.huntPlayer(player);
};

Monster.prototype.rangedAI = function (player) {
	if (!this.seen) {
		if (Math.random() < 0.5) {
			this.walkRandom(player);
		} else {
			this.huntPlayer(player);
		}
	} else {
		this.attack(player, true);
	}
};

Monster.prototype.meleeRangedAI = function (player) {
	var dx = player.x - this.x, dy = player.y - this.y;
	if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
		this.attack(player);
	} else if (dx * dx + dy * dy <= 4) {
		this.attack(player, true);
	} else if (!this.seen) {
		this.rangedAI(player);
	} else if (Math.random() < 0.5) {
		this.attack(player, true);
	} else {
		this.huntPlayer(player);
	}
};

Monster.prototype.hintAI = function (player) {
	var hint;
	if (!this.seen) {
		return;
	}
	hint = player.getHint();
	if (this.lastHint !== hint) {
		log(this.getDesc(true) + ': “' + hint + '”');
		this.lastHint = hint;
	} else {
		this.walkRandom(player);
	}
};

Monster.prototype.monsterAI = function (player) {
	if (!this.seenBefore) {
		return;
	}
	switch (this.aiMode) {
	case 'ranged':
		this.rangedAI(player);
		break;
	case 'meleeRanged':
		this.meleeRangedAI(player);
		break;
	case 'hint':
		this.hintAI(player);
		break;
	default:
		this.meleeAI(player);
	}
};

return Monster;
})();