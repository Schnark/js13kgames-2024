/*global Dungeon: true*/
/*global generateLevel, Level, log*/
Dungeon =
(function () {
"use strict";

function Dungeon () {
	this.levels = [this.createLevel(3, 3, 0)];
	this.currentLevel = 0;
}

Dungeon.prototype.init = function (player) {
	player.x = 3;
	player.y = 3;
	player.level = this.levels[0];
	this.levels[0].spawnMonster(player, true);
};

Dungeon.prototype.createLevel = function (x0, y0, depth) {
	var map = generateLevel(x0, y0);

	function addRandom (c) {
		var i, pos;
		for (i = 0; i < 10000; i++) {
			pos = Math.floor(Math.random() * map.length);
			if (map.charAt(pos) === '.') {
				map = map.slice(0, pos) + c + map.slice(pos + 1);
				return true;
			}
		}
	}

	addRandom('%');
	addRandom('%');
	addRandom('%');
	addRandom('*');
	map = map.replace(/\./g, ' ');
	if (depth === 0) {
		map = map.replace('<', ' ');
	} else if (depth === 2) {
		map = map.replace('>', ' ');
	}
	return new Level(map);
};

Dungeon.prototype.goUp = function (player) {
	log('you climb up the ladder.');
	this.currentLevel--;
	player.level = this.levels[this.currentLevel];
};

Dungeon.prototype.goDown = function (player) {
	var level;
	log('you climb down the ladder.');
	this.currentLevel++;
	if (!this.levels[this.currentLevel]) {
		level = this.createLevel(player.x, player.y, this.currentLevel);
		this.levels.push(level);
	}
	player.level = this.levels[this.currentLevel];
	if (level) {
		level.spawnMonster(player, true);
	}
};

return Dungeon;
})();