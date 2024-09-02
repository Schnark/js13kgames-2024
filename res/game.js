/*global events, Dungeon, Player*/
(function () {
"use strict";

var start = document.getElementById('start'),
	game = document.getElementById('game');

function startGame (mode) {
	var dungeon = new Dungeon(mode),
		player = new Player(dungeon);

	start.hidden = true;
	game.hidden = false;
	events.init(player);
}

document.getElementById('game-0').addEventListener('click', function () {
	startGame(0);
});
document.getElementById('game-1').addEventListener('click', function () {
	startGame(1);
});
})();