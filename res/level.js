/*global Level: true*/
/*global Tile, Monster, log*/
Level =
(function () {
"use strict";

function Level (data) {
	this.tiles = data.split('\n').map(function (line) {
		return line.split('').map(function (c) {
			return new Tile(c);
		});
	});
	this.npc = [];
}

Level.prototype.draw = function (canvas, player) {
	var h = this.tiles.length, w = this.tiles[0].length, x, y, i, monster, monsterVisible = false;

	canvas.setSize(w, h);

	canvas.ctx.fillStyle = '#000';
	canvas.ctx.fillRect(0, 0, w * 16, h * 16);
	for (x = 0; x < w; x++) {
		for (y = 0; y < h; y++) {
			canvas.ctx.save();
			canvas.ctx.translate(x * 16, y * 16);
			this.tiles[y][x].draw(canvas, player.canSee(x, y));
			canvas.ctx.restore();
		}
	}

	this.visibleMonsters = [];
	for (i = 0; i < this.npc.length; i++) {
		monster = this.npc[i];
		x = monster.x;
		y = monster.y;
		if (player.canSee(x, y)) {
			canvas.ctx.save();
			canvas.ctx.translate(x * 16, y * 16);
			monster.draw(canvas);
			canvas.ctx.restore();
			if (!monster.seen) {
				log(
					monster.seenBefore ?
						'you see ' + monster.getDesc(true) + ' again.' :
						'you see ' + monster.getDesc() + '.'
				);
			}
			monster.seen = true;
			monster.seenBefore = true;
			monsterVisible = true;
			this.visibleMonsters.push(monster);
		} else {
			monster.seen = false;
		}
	}
	canvas.ctx.save();
	canvas.ctx.translate(player.x * 16, player.y * 16);
	player.draw(canvas);
	canvas.ctx.restore();

	player.showLuck();

	return monsterVisible;
};

Level.prototype.isOpen = function (x, y) {
	if (
		x < 0 || x >= this.tiles[0].length ||
		y < 0 || y >= this.tiles.length
	) {
		return false;
	}
	return this.tiles[y][x].isOpen();
};

Level.prototype.hasBeenSeen = function (x, y) {
	if (
		x < 0 || x >= this.tiles[0].length ||
		y < 0 || y >= this.tiles.length
	) {
		return false;
	}
	return this.tiles[y][x].isSeen();
};

Level.prototype.getType = function (x, y) {
	return this.tiles[y][x].getType();
};

Level.prototype.takeItem = function (x, y) {
	return this.tiles[y][x].takeItem();
};

Level.prototype.monsterAt = function (x, y) {
	var i, monster;
	for (i = 0; i < this.npc.length; i++) {
		monster = this.npc[i];
		if (monster.x === x && monster.y === y) {
			return monster;
		}
	}
};

Level.prototype.findFreeTile = function (player) {
	var i, x, y;
	for (i = 0; i < 10000; i++) {
		x = Math.floor(Math.random() * this.tiles[0].length);
		y = Math.floor(Math.random() * this.tiles.length);
		if (
			this.isOpen(x, y) &&
			!this.monsterAt(x, y) &&
			!player.canSee(x, y)
		) {
			return [x, y];
		}
	}
};

Level.prototype.spawnMonster = function (player, init) {
	var pos, monster;
	if (!init && Math.random() > 0.05) {
		return;
	}
	pos = this.findFreeTile(player);
	if (!pos) {
		return;
	}
	monster = new Monster('x', pos[0], pos[1], this);
	this.npc.push(monster);
};

Level.prototype.removeMonster = function (monster) {
	var i = this.npc.indexOf(monster);
	//assume i !== -1
	this.npc.splice(i, 1);
};

function dist (x0, y0, x1, y1) {
	return Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
}

function aStar (x0, y0, x1, y1, getNeighbours) {
	var todo = [], done = {}, data, id, neighbours, i, path;

	function addTodo (x, y, prev) {
		var data = {
			x: x,
			y: y,
			prev: prev,
			g: prev ? prev.g + 1 : 0,
			h: dist(x0, y0, x, y)
		}, i, f, fi;
		f = data.g + data.h;
		for (i = 0; i < todo.length; i++) {
			fi = todo[i].g + todo[i].h;
			if (f < fi || (f === fi && data.h < todo[i].h)) {
				todo.splice(i, 0, data);
				return;
			}
		}
		todo.push(data);
	}

	addTodo(x1, y1);
	while (todo.length) {
		data = todo.shift();
		id = data.x + ',' + data.y;
		if (done[id]) {
			continue;
		}
		done[id] = data;
		if (data.x === x0 && data.y === y0) {
			break;
		}
		neighbours = getNeighbours(data.x, data.y);
		for (i = 0; i < neighbours.length; i++) {
			id = neighbours[i][0] + ',' + neighbours[i][1];
			if (!done[id]) {
				addTodo(neighbours[i][0], neighbours[i][1], data);
			}
		}
	}
	data = done[x0 + ',' + y0];
	if (!data) {
		return;
	}
	path = [];
	while (data) {
		path.push([data.x, data.y]);
		data = data.prev;
	}
	return path;
}

Level.prototype.findPath = function (x0, y0, x1, y1, onlySeen) {
	var level = this;
	return aStar(x0, y0, x1, y1, function (x, y) {
		return [
			//first straight
			[-1, 0], [1, 0], [0, -1], [0, 1],
			//then diagonal
			[-1, -1], [1, -1], [-1, 1], [1, 1]
		].map(function (rel) {
			return [x + rel[0], y + rel[1]];
		}).filter(function (pos) {
			return level.isOpen(pos[0], pos[1]) && (!onlySeen || level.hasBeenSeen(pos[0], pos[1]));
		});
	});
};

Level.prototype.autoexplore = function (player) {
	var minD = Infinity, minX, minY, d, x, y, path, i;
	for (x = 0; x < this.tiles[0].length; x++) {
		for (y = 0; y < this.tiles.length; y++) {
			if (this.isOpen(x, y) && !this.hasBeenSeen(x, y)) {
				//shortest path would be better, but more expensive
				d = Math.max(Math.abs(player.x - x), Math.abs(player.y - y));
				if (d < minD) {
					minX = x;
					minY = y;
					minD = d;
				}
			}
		}
	}
	if (minD === Infinity) {
		return;
	}
	path = this.findPath(player.x, player.y, minX, minY);
	if (!path) { //shouldn't happen
		return;
	}
	for (i = 0; i < path.length; i++) {
		if (!this.hasBeenSeen(path[i][0], path[i][1])) {
			path.length = i + 1;
			return path;
		}
	}
	return path;
};

return Level;
})();