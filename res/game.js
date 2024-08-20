/*global events, generateLevel, Level, Player*/
(function () {
"use strict";

var level = new Level(generateLevel(3, 3).replace(/[*.]/g, ' ')),
	player = new Player(3, 3, level);

level.spawnMonster(player, true);

events.init(player);
})();