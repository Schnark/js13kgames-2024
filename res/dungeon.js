/*global Dungeon: true*/
/*global generateLevel, Level, Monster, log, sound*/
Dungeon =
(function () {
"use strict";

/*
Short game
==========
6 levels
lamp (() and horseshoe ()) randomly on first two levels
Chimney sweep with hint about all these items on third level
Level 4 or 5 is a maze.
On levels 3 to 5 two henchmen from start, and one may be randomly spawned on these levels
On last level Lord Balsekil and all remaining henchmen (including those from above, up to 8), surrounding him

1: newts only 4:2:1
2: newts 4:2:1, cats 1:0:0, crows 1:0:0, mirror monster 1
3: newts: 1:2:1, cats 2:1:1, crows 2:1:1, mirror monster 3, henchman 1.5
4: newts: 1:1:2, cats 1:2:1, crows 1:2:1, mirror monster 3, henchman 1.5
5: newts: 0:0.5:1, cats 1:1:2, crows 1:1:2, mirror monster 3, henchman 1.5
6: newts: 0:0.5:1, cats 1:2:4, crows 1:2:4, mirror monster 4

Normal game
===========
13 levels
horseshoe ()) randomly on first two levels
lamp (() randomly on second or third level
Chimney sweep with hint about all these items on fourth level
Up to two levels between level 4 and 12 (including) are mazes.
On levels 5 to 12 one henchman from start, and two may be randomly spawned on these levels
On last level Lord Balsekil and all remaining henchmen (including those from above, up to 13), surrounding him

1 as above
2, 3 as 2 above
4, 5, 6 as 3 above
7, 8, 9 as 4 above
10, 11, 12 as 5 abobe
13 as 6 above

Number of monsters at start (not including henchmen) rises from 3 on first to 6 on last level.
Monster spawn rate rises from 0.02 on first to 0.05 on last level.

In all cases 2 to 4 clover and 1 to 3 mushrooms per level.
Also 1 lucky charm (*) on first level, no on the last, 5 more randomly distributed.
Also 1 fortune cookie (?) on each of the first five levels.
*/
function Dungeon (mode) {
	this.prepare(mode);
	this.levels = [this.createLevel(3, 3, 0)];
	this.currentLevel = 0;
	this.henchmen = [];
}

Dungeon.prototype.prepare = function (mode) {
	var h0, h1, p, probs, i, j, c;

	function normalize (data) {
		var keys = Object.keys(data), i, s = 0;
		for (i = 0; i < keys.length; i++) {
			s += data[keys[i]];
		}
		for (i = 0; i < keys.length; i++) {
			data[keys[i]] /= s;
		}
		return data;
	}

	h0 = [
		[0, 0, 2, 2, 2, 0],
		[0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
	];
	h1 = [
		[0, 0, 3, 5, 7, 8],
		[0, 0, 0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13]
	];
	p = [
		[0, 1, 2, 3, 4, 5],
		[0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5]
	];
	probs = [
		normalize({':1': 4, ':2': 2, ':3': 1}),
		normalize({':1': 4, ':2': 2, ':3': 1, 'f1': 1, 'B1': 1, 'n': 1}),
		normalize({':1': 1, ':2': 2, ':3': 1, 'f1': 2, 'f2': 1, 'f3': 1, 'B1': 2, 'B2': 1, 'B3': 1, 'n': 3, '&1': 1.5}),
		normalize({':1': 1, ':2': 1, ':3': 2, 'f1': 1, 'f2': 2, 'f3': 1, 'B1': 1, 'B2': 2, 'B3': 1, 'n': 3, '&1': 1.5}),
		normalize({':2': 0.5, ':3': 1, 'f1': 1, 'f2': 1, 'f3': 2, 'B1': 1, 'B2': 1, 'B3': 2, 'n': 3, '&1': 1.5}),
		normalize({':2': 0.5, ':3': 1, 'f1': 1, 'f2': 2, 'f3': 4, 'B1': 1, 'B2': 2, 'B3': 4, 'n': 4})
	];

	this.levelData = [];
	for (i = 0; i < h0[mode].length; i++) {
		this.levelData.push({items: []});
		c = 2 + Math.floor(Math.random() * 3);
		for (j = 0; j < c; j++) {
			this.levelData[i].items.push('%');
		}
		c = 1 + Math.floor(Math.random() * 2);
		for (j = 0; j < c; j++) {
			this.levelData[i].items.push('F');
		}

		this.levelData[i].h0 = h0[mode][i];
		this.levelData[i].h1 = h1[mode][i];
		this.levelData[i].p = probs[p[mode][i]];
	}
	for (i = 0; i < 5; i++) {
		this.levelData[i].items.push('?');
	}

	this.levelData[Math.floor(Math.random() * 2)].items.unshift(')'); //horseshoe on level 1 or 2
	this.levelData[Math.floor(Math.random() * 2) + (mode === 1 ? 1 : 0)].items.unshift('('); //lamp on 1 or 2 / 2 or 3

	c = mode === 1 ? 3 : 2;
	this.levelData[0].items.unshift('*');
	this.elc = [1, c]; //"early lucky charms", number of lucky charms before chimney sweep, and that level
	for (i = 0; i < 5; i++) { //5 more lucky charms
		j = Math.floor(Math.random() * (this.levelData.length - 1));
		this.levelData[j].items.unshift('*');
		if (j < c) {
			this.elc[0]++;
		}
	}
	this.levelData[c].c = true;
	if (mode === 0) {
		this.levelData[3 + Math.floor(2 * Math.random())].m = true;
	} else {
		this.levelData[4 + Math.floor(8 * Math.random())].m = true;
		this.levelData[4 + Math.floor(8 * Math.random())].m = true;
	}
};

Dungeon.prototype.init = function (player) {
	player.place(3, 3, this.levels[0]);
	player.elc = this.elc;
	this.initMonsters(player);
};

Dungeon.prototype.createLevel = function (x0, y0, depth) {
	var map = generateLevel(x0, y0, this.levelData[depth].m, depth === this.levelData.length - 1), i;

	function addRandom (c) {
		var i, pos;
		for (i = 0; i < 10000; i++) {
			pos = Math.floor(Math.random() * map.length);
			if (map.charAt(pos) === '.') {
				map = map.slice(0, pos) + c + map.slice(pos + 1);
				return;
			}
		}
		map = map.replace(/./, c); //if it failed that often, just use the first place
	}

	for (i = 0; i < this.levelData[depth].items.length; i++) {
		addRandom(this.levelData[depth].items[i]);
	}
	map = map.replace(/\./g, ' ');
	if (depth === 0) { //remove ladder up on first level
		map = map.replace('<', ' ');
	}
	//ladder down on last level is used as start for Lord Balsekil and removed later
	return new Level(map, depth);
};

Dungeon.prototype.goUp = function (player) {
	log('you climb up the ladder.');
	this.levels[this.currentLevel].leave();
	this.currentLevel--;
	player.level = this.levels[this.currentLevel];
	document.getElementById('level').textContent = 'Level ' + (this.currentLevel + 1);
};

Dungeon.prototype.goDown = function (player) {
	var level;
	log('you climb down the ladder.');
	this.levels[this.currentLevel].leave();
	this.currentLevel++;
	if (!this.levels[this.currentLevel]) {
		level = this.createLevel(player.x, player.y, this.currentLevel);
		this.levels.push(level);
	}
	player.level = this.levels[this.currentLevel];
	document.getElementById('level').textContent = 'Level ' + (this.currentLevel + 1);
	if (level) {
		this.initMonsters(player);
	}
};

Dungeon.prototype.createHenchman = function () {
	var monster;
	if (this.henchmen.length === this.maxHenchmen) {
		return new Monster('n');
	}
	monster = new Monster('&1');
	this.henchmen.push(monster);
	monster.desc[1] += this.henchmen.length;
	return monster;
};

Dungeon.prototype.createMonster = function (type) {
	if (type === '&1') {
		return this.createHenchman();
	}
	return new Monster(type);
};

Dungeon.prototype.createRandomMonster = function (data) {
	var keys = Object.keys(data), p = Math.random();
	while (keys.length > 1 && data[keys[0]] < p) {
		p -= data[keys[0]];
		keys.shift();
	}
	return this.createMonster(keys[0]);
};

Dungeon.prototype.addRandomMonster = function (player, henchman) {
	var pos, level = this.levels[this.currentLevel];
	pos = level.findFreeTile(player);
	if (pos) {
		level.addMonster(
			henchman ? this.createHenchman() : this.createRandomMonster(this.levelData[this.currentLevel].p),
			pos[0], pos[1]
		);
	}
};

Dungeon.prototype.initMonsters = function (player) {
	var pos, pos0, i,
		level = this.levels[this.currentLevel],
		levelData = this.levelData[this.currentLevel];
	if (levelData.c) {
		pos = level.findFirst('<');
		if (level.isOpen(pos[0] - 1, pos[1])) {
			pos[0]--;
		} else {
			pos[0]++;
		}
		level.addMonster(new Monster('@2'), pos[0], pos[1]);
	}
	this.maxHenchmen = levelData.h1;
	if (this.currentLevel === this.levelData.length - 1) {
		pos0 = level.findFirst('>');
		level.takeItem(pos0[0], pos0[1]);
		level.addMonster(new Monster('&2'), pos0[0], pos0[1]);

		this.transferHenchmen(pos0[0], pos0[1], player, level);
		while (this.henchmen.length < this.maxHenchmen) {
			pos = level.findFreeTileNear(pos0[0], pos0[1], player);
			level.addMonster(this.createHenchman(), pos[0], pos[1]);
		}
	} else {
		for (i = 0; i < levelData.h0; i++) {
			this.addRandomMonster(player, true);
		}
	}
	for (i = 0; i < 3 + Math.floor(3 * this.currentLevel / (this.levelData.length - 1)); i++) {
		this.addRandomMonster(player);
	}
};

Dungeon.prototype.spawnMonster = function (player) {
	if (Math.random() > 0.02 + 0.03 * this.currentLevel / (this.levelData.length - 1)) {
		return;
	}
	this.addRandomMonster(player);
};

Dungeon.prototype.transferHenchmen = function (x, y, player, level) {
	var i, henchman, pos, somethingDone = false;
	if (this.henchmenTransferred) {
		return;
	}
	for (i = 0; i < this.henchmen.length; i++) {
		henchman = this.henchmen[i];
		if (henchman.health === 0) {
			continue;
		}
		pos = level.findFreeTileNear(x, y, player);
		henchman.level.removeMonster(henchman);
		level.addMonster(henchman, pos[0], pos[1]);
		somethingDone = true;
	}
	if (somethingDone) {
		log('you sense that all of Lord Balsekil’s henchmen rushed to his help.', 'b');
		sound('ranged');
	}
	this.henchmenTransferred = true;
};

return Dungeon;
})();