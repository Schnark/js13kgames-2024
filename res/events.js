/*global events: true*/
/*global log, Canvas*/
events =
(function () {
"use strict";

var queue = [], queueTimeout, DELAY = 200, player, gameOver = false,
	canvas = new Canvas('canvas');

function getKey (e) {
	if (e.key && e.key !== 'Unidentified') {
		return {
			Left: 'ArrowLeft',
			Up: 'ArrowUp',
			Right: 'ArrowRight',
			Down: 'ArrowDown'
		}[e.key] || e.key;
	}
	return {
		12: 'Clear',
		33: 'PageUp',
		34: 'PageDown',
		35: 'End',
		36: 'Home',
		37: 'ArrowLeft',
		38: 'ArrowUp',
		39: 'ArrowRight',
		40: 'ArrowDown'
	}[e.which] || String.fromCharCode(e.which).toLowerCase();
}

function addMove (dx, dy, repeat) {
	var x, y;
	if (repeat) {
		x = player.x + dx;
		y = player.y + dy;
		while (player.level.isOpen(x, y)) {
			queue.push(['move', dx, dy]);
			x += dx;
			y += dy;
		}
	} else {
		queue.push(['move', dx, dy]);
	}
}

function addMoves (path) {
	var i, x, y;
	for (i = 0; i < path.length; i++) {
		if (i > 0) {
			queue.push(['move', path[i][0] - x, path[i][1] - y]);
		}
		x = path[i][0];
		y = path[i][1];
	}
}

function addWait (repeat) {
	var i;
	for (i = 0; i < (repeat ? 10 : 1); i++) {
		queue.push(['wait']);
	}
	if (repeat) {
		queue.push(['autowait']);
	}
}

function onKey (e) {
	switch (getKey(e)) {
	case '1':
	case 'End':
		addMove(-1, 1, e.shiftKey);
		break;
	case '2':
	case 'ArrowDown':
		addMove(0, 1, e.shiftKey);
		break;
	case '3':
	case 'PageDown':
		addMove(1, 1, e.shiftKey);
		break;
	case '4':
	case 'ArrowLeft':
		addMove(-1, 0, e.shiftKey);
		break;
	case '5':
	case 'Clear':
	case 'w':
	case 'W':
		addWait(e.shiftKey);
		break;
	case '6':
	case 'ArrowRight':
		addMove(1, 0, e.shiftKey);
		break;
	case '7':
	case 'Home':
		addMove(-1, -1, e.shiftKey);
		break;
	case '8':
	case 'ArrowUp':
		addMove(0, -1, e.shiftKey);
		break;
	case '9':
	case 'PageUp':
		addMove(1, -1, e.shiftKey);
		break;
	case 'c':
		queue = [];
		break;
	case 'f':
		queue.push(['attack']);
		break;
	case 'x':
		queue.push(['autoexplore']);
		break;
	}
	if (!e.ctrlKey && !e.altKey) {
		e.preventDefault();
	}
	workQueue();
}

function onMouse (e) {
	var pos, x, y, monster, path;

	pos = canvas.getTile(e.clientX, e.clientY);
	x = pos[0];
	y = pos[1];

	if (!player.level.hasBeenSeen(x, y)) {
		log('you don’t know how to go there.');
	} else if (!player.level.isOpen(x, y)) {
		log('you cannot go there.');
	} else if (player.canSee(x, y) && (monster = player.level.monsterAt(x, y))) {
		if (Math.abs(x - player.x) <= 1 && Math.abs(y - player.y) <= 1) {
			queue.push(['move', x - player.x, y - player.y]);
		} else {
			queue.push(['attack']); //TODO pick the selected one
		}
	} else {
		path = player.level.findPath(player.x, player.y, x, y, true);
	}

	if (path) {
		addMoves(path);
	}
	workQueue();
}

function init (p) {
	player = p;
	document.addEventListener('keydown', onKey);
	canvas.canvas.addEventListener('click', onMouse);
	player.level.draw(canvas, player);
}

function workQueue () {
	var action, didSomething = false, i, monster, monsterSeen, path;
	clearTimeout(queueTimeout);
	while (!didSomething) {
		if (queue.length === 0) {
			return; //wait for input
		}
		action = queue.shift();
		if (gameOver) { //TODO once we get an action "new game" allow that after gameOver
			return;
		}
		switch (action[0]) {
		case 'move':
			didSomething = player.moveRel(action[1], action[2]);
			break;
		case 'attack':
			monster = player.level.visibleMonsters[0]; //TODO allow picking a monster if there is more than one
			if (monster) {
				player.attack(monster, true);
				didSomething = true;
			}
			break;
		case 'wait':
			didSomething = true;
			break;
		case 'autowait':
			log('still waiting, press c to cancel.');
			addWait(true);
			break;
		case 'autoexplore':
			path = player.level.autoexplore(player);
			if (!path) {
				log('level completely explored');
			} else {
				addMoves(path);
				queue.push(['autoexplore']);
			}
			break;
		}
	}

	log.async(true);
	//otherwise you might get the message "monster hits you" before "you see monster"

	player.level.spawnMonster(player);
	for (i = 0; i < player.level.npc.length; i++) {
		monster = player.level.npc[i];
		if (!monster.speed) {
			monster.monsterAI(player);
		} else {
			monster.movesLeft = (monster.movesLeft || 0) + 1;
			while (monster.movesLeft >= monster.speed) {
				monster.monsterAI(player);
				monster.movesLeft -= monster.speed;
			}
		}
	}

	log.async(false);
	monsterSeen = player.level.draw(canvas, player);
	log.clearQueue();

	if (monsterSeen) {
		queue = [];
	}
	if (player.health === 0) {
		queue = [];
		gameOver = true;
	}
	if (queue.length > 0) {
		queueTimeout = setTimeout(workQueue, DELAY);
	}
}

return {
	init: init
};
})();