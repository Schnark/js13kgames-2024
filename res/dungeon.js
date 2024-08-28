/*global Dungeon: true*/
/*global generateLevel, Level, Monster, log*/
Dungeon =
(function () {
"use strict";

/*
Current plan:

Short game
==========
6 levels
1 lucky charm (*) on first level, no on the last, 5 more randomly distributed
lamp (() and horseshoe ()) randomly on first two levels
Chimney sweep with hint about all these items on third level
On levels 3 to 5 two henchmen from start, and one may be randomly spawned on these levels
On last level Lord Balsekil and all remaining henchmen (including those from above, up to 8), surrounding him

Normal game
===========
13 levels
6 lucky charms (*) randomly distributed, but no on the last level
horseshoe ()) randomly on first two levels
lamp ()) randomly on second or third level
Chimney sweep with hint about all these items on fourth level
On levels 4 to 12 one henchman from start, and two may be randomly spawned on these levels
On last level Lord Balsekil and all remaining henchmen (including those from above, up to 13), surrounding him
*/
function Dungeon () {
	var i, j, c;

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

	this.levelData = [{items: [], monsters: []}, {items: [], monsters: []}, {items: [], monsters: []}];
	//items
	this.levelData[Math.floor(Math.random() * 2)].items.push('(');
	this.levelData[Math.floor(Math.random() * 2)].items.push(')');
	this.levelData[Math.floor(Math.random() * 2)].items.push('*');
	this.levelData[Math.floor(Math.random() * 2)].items.push('*');
	for (i = 0; i < this.levelData.length; i++) {
		c = 2 + Math.floor(Math.random() * 2);
		for (j = 0; j < c; j++) {
			this.levelData[i].items.push('%');
		}
		c = 1 + Math.floor(Math.random() * 2);
		for (j = 0; j < c; j++) {
			this.levelData[i].items.push('F');
		}
	}
	//monsters
	for (i = 0; i < this.levelData.length; i++) {
		this.levelData[i].monsters.push(':1');
		this.levelData[i].monsters.push((i + 1) * Math.random() < 1 ? ':1' : ':2');
		if (i === 1) {
			this.levelData[i].monsters.push(Math.random() < 0.5 ? '&1' : 'n');
		}
		if (i >= 1) {
			this.levelData[i].monsters.push(Math.random() < 0.5 ? 'f1' : 'B1');
		}
		this.levelData[i].monsterProbs = normalize({
			':1': 3, ':2': 2, ':3': 1,
			'f1': (i - 1), 'f2': (i - 1) / 2, 'f3': (i - 1) / 4,
			'B1': (i - 1), 'B2': (i - 1) / 2, 'B3': (i - 1) / 4,
			'n': 2, '&1': 1
		});
	}

	this.levels = [this.createLevel(3, 3, 0)];
	this.currentLevel = 0;
	this.henchmen = [];
	this.maxHenchmen = 1;
}

Dungeon.prototype.init = function (player) {
	player.place(3, 3, this.levels[0]);
	player.missedEarlyLuckyCharms = 2; //number of lucky charms on first two levels
	this.initMonsters(player);
};

Dungeon.prototype.createLevel = function (x0, y0, depth) {
	var map = generateLevel(x0, y0), i;

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
	if (depth === 0) {
		map = map.replace('<', ' ');
	} else if (depth === this.levelData.length - 1) {
		map = map.replace('>', ' ');
	}
	return new Level(map, depth);
};

Dungeon.prototype.goUp = function (player) {
	log('you climb up the ladder.');
	this.levels[this.currentLevel].leave();
	this.currentLevel--;
	player.level = this.levels[this.currentLevel];
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

Dungeon.prototype.initMonsters = function (player) {
	var pos, level = this.levels[this.currentLevel], i, data;
	if (this.currentLevel === 2) {
		pos = level.findFirst('<');
		if (level.isOpen(pos[0] - 1, pos[1])) {
			pos[0]--;
		} else {
			pos[0]++;
		}
		level.addMonster(new Monster('@2'), pos[0], pos[1]);
	}
	if (this.currentLevel === this.levelData.length - 1) {
		pos = level.findFreeTile(player); //TODO place him in a free arean
		level.addMonster(new Monster('&2'), pos[0], pos[1]);

		this.transferHenchmen(pos[0], pos[1], player, level);
		this.maxHenchmen = 2;
		pos = level.findFreeTileNear(pos[0], pos[1], player);
		level.addMonster(this.createHenchman(), pos[0], pos[1]);
	}
	data = this.levelData[this.currentLevel].monsters;
	for (i = 0; i < data.length; i++) {
		pos = level.findFreeTile(player);
		if (pos) {
			level.addMonster(this.createMonster(data[i]), pos[0], pos[1]);
		}
	}
};

Dungeon.prototype.spawnMonster = function (player) {
	var pos, level = this.levels[this.currentLevel];
	if (Math.random() > 0.05) {
		return;
	}
	pos = level.findFreeTile(player);
	if (pos) {
		level.addMonster(this.createRandomMonster(this.levelData[this.currentLevel].monsterProbs), pos[0], pos[1]);
	}
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
	}
	this.henchmenTransferred = true;
};

return Dungeon;
})();