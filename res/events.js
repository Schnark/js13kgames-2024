/*global events: true*/
/*global log, Canvas*/
events =
(function () {
"use strict";

var queue = [], queueTimeout,
	rangedTargets,
	DELAY = 200,
	player, gameOver = false,
	canvas = new Canvas();

function getPrintableKey (code, shift) {
	var c = String.fromCharCode(code).toLowerCase();
	if (shift) {
		c = {'<': '>'}[c] || c.toUpperCase();
	}
	return c;
}

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
	}[e.which] || getPrintableKey(e.which, e.shiftKey);
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
	var key;

	if (e.ctrlKey || e.altKey) {
		return;
	}
	key = getKey(e);
	queue = []; //abort any ongoing action

	if (rangedTargets) {
		if (rangedTargets[key]) {
			queue.push(rangedTargets[key]);
		}
		rangedTargets = false;
		canvas.clearTargets();
		key = '';
	}

	switch (key) {
	//TODO hjklyubn?
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
	case '<':
		queue.push(['goUp']);
		break;
	case '>':
		queue.push(['goDown']);
		break;
	case 'c':
		//queue = [];
		break;
	case 'e':
		queue.push(['eat']);
		break;
	case 'f':
		queue.push(['attack']);
		break;
	case 'x':
		queue.push(['autoexplore']);
		break;
	}
	e.preventDefault();
	workQueue();
}

function onMouse (e) {
	var pos, x, y, monster, type, path;

	if (gameOver) {
		return;
	}

	pos = canvas.getTile(e.clientX, e.clientY);
	x = pos[0];
	y = pos[1];

	queue = [];

	if (!player.level.hasBeenSeen(x, y)) {
		log('you don’t know how to go there.');
	} else if (!player.level.isOpen(x, y)) {
		log('you cannot go there.');
	} else if (player.canSee(x, y) && (monster = player.level.monsterAt(x, y))) {
		if (Math.abs(x - player.x) <= 1 && Math.abs(y - player.y) <= 1) {
			queue.push(['move', x - player.x, y - player.y]);
		} else {
			queue.push(['attack', x, y]);
		}
	} else if (player.x === x && player.y === y) {
		type = player.level.getType(x, y);
		if (type !== '<' && type !== '>') {
			queue.push(['wait']);
		}
	} else {
		type = player.level.getType(x, y);
		path = player.level.findPath(player.x, player.y, x, y, true);
	}

	if (path) {
		addMoves(path);
	}
	if (type === '>') {
		queue.push(['goDown']);
	} else if (type === '<') {
		queue.push(['goUp']);
	}
	workQueue();
}

function onMouseInv (e) {
	if (e.target.className === 'mushroom') {
		queue.push(['eat']);
		workQueue();
	}
}

function init (p) {
	canvas.loadSprites(function () {
		player = p;
		document.addEventListener('keydown', onKey);
		canvas.canvas.addEventListener('click', onMouse);
		document.getElementById('inv').addEventListener('click', onMouseInv);
		player.level.draw(canvas, player);
		log('welcome. Find all three lucky charms to win.', 'b');
	});
}

function workQueue () {
	var action, didSomething = false, i, c, monster, monsterSeen, path;
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
		case 'goUp':
			didSomething = player.goUp();
			break;
		case 'goDown':
			didSomething = player.goDown();
			break;
		case 'eat':
			didSomething = player.eat();
			break;
		case 'attack':
			if (action[1]) { //since the x coordinate can't be 0 this will work
				for (i = 0; i < player.level.visibleMonsters.length; i++) {
					monster = player.level.visibleMonsters[i];
					if (monster.x === action[1] && monster.y === action[2]) {
						break;
					} else {
						monster = null;
					}
				}
			} else if (player.level.visibleMonsters.length > 1) {
				rangedTargets = {};
				for (i = 0; i < player.level.visibleMonsters.length; i++) {
					monster = player.level.visibleMonsters[i];
					c = i < 9 ? String(i + 1) : String.fromCharCode(97 + i - 9);
					rangedTargets[c] = ['attack', monster.x, monster.y];
					canvas.showTarget(monster.x, monster.y, c);
				}
				monster = null;
				log('pick the target (1–' + c + ').');
			} else {
				monster = player.level.visibleMonsters[0];
			}
			if (monster) {
				player.attack(monster, true);
				if (player.hasHorseshoe) {
					player.usesHorseshoe = true;
				}
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
				log('level completely explored.');
			} else {
				addMoves(path);
				queue.push(['autoexplore']);
			}
			break;
		}
	}

	log.async(true);
	//otherwise you might get the message "monster hits you" before "you see monster"

	player.steps++;
	player.dungeon.spawnMonster(player);
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
	player.handleTimeouts();
	player.usesHorseshoe = false;

	log.async(false);
	monsterSeen = player.level.draw(canvas, player);
	canvas.runAnimations();
	log.clearQueue();

	if (monsterSeen) {
		queue = [];
	}
	if (player.health === 0) {
		queue = [];
		gameOver = true;
	}
	if (player.luckyCharms === 3) {
		log('you found all lucky charms and win the game.', 'b');
		gameOver = true;
	}
	if (gameOver) {
		log(player.getResult());
	}
	if (queue.length > 0) {
		queueTimeout = setTimeout(workQueue, DELAY);
	}
}

return {
	init: init
};
})();