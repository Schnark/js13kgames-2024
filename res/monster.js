/*global Monster: true*/
/*global MonsterBase, log*/
Monster =
(function () {
"use strict";

function Monster (type) {
	this.type = type;

	//updated on level draw
	this.seen = false;
	this.seenBefore = false;

	this.init(Monster.data[type]);
}

Monster.prototype = new MonsterBase();

//TODO balance values (also elsewhere, i.e. item and moster probs in dungeon.js,
//basic attack values in monster.js, and timeouts in player.js)
//Since I (knowing all spoilers) win often (once with the highest possible score)
//but sometimes lose, the values seem to be quite good by now.
Monster.data = {
	//newts (slow, melee only)
	':1': {
		desc: ['a small newt', 'the small newt'],
		attackName: ['tries to touch', 'touches'],
		speed: 0.5,
		maxAttack: 1,
		health: 5
	},
	':2': {
		desc: ['a newt', 'the newt'],
		attackName: ['tries to touch', 'touches'],
		speed: 0.75
	},
	':3': {
		desc: ['a large newt', 'the large newt'],
		attackName: ['tries to touch', 'touches']
	},
	//crows (fast, melee only, blinding attack)
	'B1': {
		desc: ['a small crow', 'the small crow'],
		attackName: ['tries to peck', 'pecks'],
		maxAttack: 1,
		health: 5
	},
	'B2': {
		desc: ['a crow', 'the crow'],
		attackName: ['tries to peck', 'pecks'],
		speed: 1.25,
		maxAttack: 1,
		health: 5
	},
	'B3': {
		desc: ['a large crow', 'the large crow'],
		attackName: ['tries to peck', 'pecks'],
		speed: 1.5,
		health: 5
	},
	//black cats (normal speed, ranged only)
	'f1': {
		desc: ['a small black cat', 'the small black cat'],
		attackName: ['tries to hiss at', 'hisses at'],
		maxAttack: 1,
		aiMode: 'ranged'
	},
	'f2': {
		desc: ['a black cat', 'the black cat'],
		attackName: ['tries to hiss at', 'hisses at'],
		maxAttack: 1,
		aiMode: 'ranged'
	},
	'f3': {
		desc: ['a large black cat', 'the large black cat'],
		attackName: ['tries to hiss at', 'hisses at'],
		aiMode: 'ranged'
	},
	//mirror monster (normal speed, ranged only, shatters when you throw horseshoe at it)
	'n': {
		desc: ['a mirror monster', 'the mirror monster'],
		attackName: ['tries to cast an evil look at', 'casts an evil look at'],
		aiMode: 'ranged',
		block: 0
	},
	//Lord Balsekil and his henchmen
	'&1': {
		desc: ['one of Balsekil’s henchmen', 'Henchman No. '],
		aiMode: 'meleeRanged',
		block: 0.125,
		health: 20,
		minAttack: 1,
		maxAttack: 3,
		experience: 1.25
	},
	'&2': {
		desc: ['Lord Balsekil', 'Lord Balsekil'],
		aiMode: 'meleeRanged',
		block: 0.2,
		health: 30,
		minAttack: 1,
		maxAttack: 5,
		experience: 1.75
	},
	//chimney sweep (gives hints)
	'@2': {
		desc: ['a chimney sweep', 'the chimney sweep'],
		aiMode: 'hint',
		block: 1
	}
};

Monster.prototype.getDesc = function (the) {
	return this.desc[the ? 1 : 0];
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
	if (
		this.seen ||
		//this might happen for fast monsters
		Math.abs(player.x - this.x) <= 1 && Math.abs(player.y - this.y) <= 1
	) {
		this.attack(player, true);
	} else {
		if (Math.random() < 0.5) {
			this.walkRandom(player);
		} else {
			this.huntPlayer(player);
		}
	}
};

Monster.prototype.meleeRangedAI = function (player) {
	var dx = player.x - this.x, dy = player.y - this.y;
	if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
		this.attack(player);
	} else if (this.seen && dx * dx + dy * dy <= 4) {
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
		log(this.getDesc(true) + ': “' + hint + '”', 'b');
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