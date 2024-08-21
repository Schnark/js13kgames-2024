/*global Monster: true*/
/*global MonsterBase*/
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
	'x': ['a green monster', 'the green monster']
};
/*
brown newt: slow, melee only ("touch")
black crow: fast, melee only ("peck")
black cat: normal speed, ranged only ("hiss")

all three in small, normal size, large

mirror monster: normal speed, ranged only ("evil look"); will shatter immediately when hit with horseshoe, but gives much bad luck to player

henchman (13 of them): normal speed, melee and ranged ("spill salt"?)
Lord XIII (unique): normal speed, melee and ranged

player attacks
melee: hit with fingers crossed, hit with fly agaric (?, once you found one?)
ranged: yell lucky number (?), throw horseshoe (once you found one?)
*/

Monster.prototype.getDesc = function (the) {
	return Monster.desc[this.type][the ? 1 : 0];
};

Monster.prototype.walkRandom = function () {
	var dx, dy;
	do {
		dx = Math.floor(Math.random() * 3) - 1;
		dy = Math.floor(Math.random() * 3) - 1;
	} while (!this.level.isOpen(this.x + dx, this.y + dy));
	if (!this.level.monsterAt(this.x + dx, this.y + dy)) {
		this.moveRel(dx, dy);
	}
};

Monster.prototype.huntPlayer = function (player) {
	var path = this.level.findPath(this.x, this.y, player.x, player.y);
	if (!path || path.length < 2 || this.level.monsterAt(path[1][0], path[1][1])) {
		//fist two shouldn't happen
		this.walkRandom();
	} else {
		this.moveRel(path[1][0] - path[0][0], path[1][1] - path[0][1]);
	}
};

Monster.prototype.monsterAI = function (player) {
	if (!this.seenBefore) {
		return;
	}
	if (Math.abs(player.x - this.x) <= 1 && Math.abs(player.y - this.y) <= 1) {
		this.attack(player);
		return;
	}
	if (!this.seen) {
		this.walkRandom();
		return;
	}
	this.huntPlayer(player);
};

return Monster;
})();