/*global events, Dungeon, Player*/
(function () {
"use strict";

var dungeon = new Dungeon(),
	player = new Player(dungeon);

events.init(player);
})();