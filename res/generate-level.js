/*global generateLevel: true*/
generateLevel =
(function () {
"use strict";

var LEVEL_W_2 = 50,
	LEVEL_H_2 = 20,
	ROOM_MIN_W = 4,
	ROOM_MIN_H = 4,
	ROOM_MAX_W = 12,
	ROOM_MAX_H = 8,
	ROOMS_MAX_AREA = 0.3 * LEVEL_W_2 * LEVEL_H_2,
	ROOMS_MAX_TRIES = 10000,
	CORRIDORS_MAX_TRIES = 10000;

function rand (min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(min + Math.random() * (max + 1 - min));
}

function randEven (min, max) {
	return 2 * rand(min / 2, max / 2);
}

function roomsOverlap (r1, r2) {
	if (Math.abs(r1.x - r2.x) > (r1.x < r2.x ? r1.w : r2.w)) {
		return false;
	}
	if (Math.abs(r1.y - r2.y) > (r1.y < r2.y ? r1.h : r2.h)) {
		return false;
	}
	return true;
}

function isAdjacentToRoom (r, x, y) {
	if (x === r.x - 1 || x === r.x + r.w) {
		if (r.y - 1 <= y && y <= r.y + r.h) {
			return true;
		}
	}
	if (y === r.y - 1 || y === r.y + r.h) {
		if (r.x - 1 <= x && x <= r.x + r.w) {
			return true;
		}
	}
	return false;
}

function isAdjacentToAnyRoom (rooms, x, y) {
	var i;
	for (i = 0; i < rooms.length; i++) {
		if (isAdjacentToRoom(rooms[i], x, y)) {
			return true;
		}
	}
	return false;
}

function roomsToMap (rooms, corridors, x0, y0, centerExit) {
	var x, y, i, row, level = [];

	function add (roomOrCorridor, c) {
		var x, y;
		for (x = 0; x < roomOrCorridor.w; x++) {
			for (y = 0; y < roomOrCorridor.h; y++) {
				level[y + roomOrCorridor.y + 1][x + roomOrCorridor.x + 1] = c;
			}
		}
	}

	for (y = 0; y < LEVEL_H_2 + 2; y++) {
		row = [];
		for (x = 0; x < LEVEL_W_2 + 2; x++) {
			row.push('#');
		}
		level.push(row);
	}
	for (i = 0; i < corridors.length; i++) {
		add(corridors[i], ' ');
	}
	for (i = 0; i < rooms.length; i++) {
		add(rooms[i], '.');
	}
	level[y0 + 1][x0 + 1] = '<';
	i = rooms.length === 1 ? 0 : rand(1, rooms.length - 1);
	if (centerExit) {
		x = Math.floor(rooms[i].w / 2) + rooms[i].x;
		y = Math.floor(rooms[i].h / 2) + rooms[i].y;
	} else {
		x = rand(0, rooms[i].w - 1) + rooms[i].x;
		y = rand(0, rooms[i].h - 1) + rooms[i].y;
	}
	level[y + 1][x + 1] = '>';
	return level.map(function (row) {
		return row.join('');
	}).join('\n');
}

function mazeToMap (open, x0, y0) {
	var x, y, i, row, level = [], dx, dy;
	dx = 1 + x0 % 2;
	dy = 1 + y0 % 2;
	for (y = 0; y < LEVEL_H_2 + 2; y++) {
		row = [];
		for (x = 0; x < LEVEL_W_2 + 2; x++) {
			row.push('#');
		}
		level.push(row);
	}
	for (i = 0; i < open.length; i++) {
		level[open[i][1] + dy][open[i][0] + dx] = '.';
	}
	level[y0 + 1][x0 + 1] = '<';
	x = randEven(0, LEVEL_W_2 - 12) + x0 % 2;
	if (Math.abs(x0 - x) <= 5) {
		x += 10;
	}
	y = randEven(0, LEVEL_H_2 - 12) + y0 % 2;
	if (Math.abs(y0 - y) <= 5) {
		y += 10;
	}
	level[y + 1][x + 1] = '>';
	return level.map(function (row) {
		return row.join('');
	}).join('\n');
}

function createRoomAround (x, y) {
	var i, room;
	for (i = 0; i < ROOMS_MAX_TRIES; i++) {
		room = {
			x: rand(0, x),
			y: rand(0, y),
			w: rand(ROOM_MIN_W, ROOM_MAX_W),
			h: rand(ROOM_MIN_H, ROOM_MAX_H)
		};
		if (
			(room.x + room.w <= LEVEL_W_2) &&
			(room.y + room.h <= LEVEL_H_2) &&
			(room.x + room.w > x) &&
			(room.y + room.h > y)
		) {
			return room;
		}
	}
	return { //so unlikely that we don't really have to care
		x: x,
		y: y,
		w: 1,
		h: 1
	};
}

function createRandomRoom (rooms) {
	var room, i;
	room = {
		x: rand(0, LEVEL_W_2 - ROOM_MIN_W),
		y: rand(0, LEVEL_H_2 - ROOM_MIN_H),
		w: rand(ROOM_MIN_W, ROOM_MAX_W),
		h: rand(ROOM_MIN_H, ROOM_MAX_H)
	};
	if (room.x + room.w > LEVEL_W_2) {
		return;
	}
	if (room.y + room.h > LEVEL_H_2) {
		return;
	}
	for (i = 0; i < rooms.length; i++) {
		if (roomsOverlap(rooms[i], room)) {
			return;
		}
	}
	return room;
}

function connectRooms (room1, room2, rooms) {
	var roomX, roomY, i, x, y, corridorX, corridorY;
	if (Math.random() < 0.5) {
		roomX = room1;
		roomY = room2;
	} else {
		roomX = room2;
		roomY = room1;
	}

	//by using even coordinates only we avoid two adjacent corridors
	//without wall between them
	//a whole corridor might still run directly next to a room,
	//but this merely extends the room
	//even if we fail to get a good coordinate, the result will
	//only look a bit ugly, but still okay
	for (i = 0; i < CORRIDORS_MAX_TRIES; i++) {
		x = randEven(roomX.x, roomX.x + roomX.w - 1);
		y = randEven(roomY.y, roomY.y + roomY.h - 1);
		if (!isAdjacentToAnyRoom(rooms, x, y)) {
			break;
		}
	}

	corridorX = {
		x: x,
		y: Math.min(roomX.y, y),
		w: 1,
		h: Math.abs(roomX.y - y) + 1
	};
	corridorY = {
		x: Math.min(roomY.x, x),
		y: y,
		w: Math.abs(roomY.x - x) + 1,
		h: 1
	};
	return [corridorX, corridorY];
}

function generateRooms (x, y) {
	var rooms = [], i, room, area;
	room = createRoomAround(x, y);
	area = room.w * room.h;
	rooms.push(room);
	for (i = 0; i < ROOMS_MAX_TRIES; i++) {
		room = createRandomRoom(rooms);
		if (room) {
			area += room.w * room.h;
			rooms.push(room);
			if (area >= ROOMS_MAX_AREA) {
				break;
			}
		}
	}
	return rooms;
}

function generateCorridors (rooms) {
	var i, corridors = [];
	for (i = 1; i < rooms.length; i++) {
		//connect each room to one of the preceding ones, this will connect all rooms
		//and since the corridors may overlap other rooms and other corridors
		//we will not get a topological tree, but something more interesting
		corridors = corridors.concat(connectRooms(rooms[rand(0, i - 1)], rooms[i], rooms));
	}
	return corridors;
}

//Randomized Kruskal's Algorithm
//w, h must be odd
function generateMaze (w, h) {
	var x, y, wall = [], open = [], desctructible = [], sets = {}, i, d, c1, c2;
	for (x = 0; x < w; x++) {
		for (y = 0; y < h; y++) {
			if (x % 2 === 0 && y % 2 === 0) {
				open.push([x, y]);
				sets[x + ',' + y] = open.length;
			} else if (x % 2 === 0 || y % 2 === 0) {
				desctructible.push([x, y]);
			} else {
				wall.push([x, y]);
			}
		}
	}
	while (desctructible.length) {
		i = rand(0, desctructible.length - 1);
		d = desctructible.splice(i, 1)[0];
		if (d[0] % 2) {
			c1 = (d[0] - 1) + ',' + d[1];
			c2 = (d[0] + 1) + ',' + d[1];
		} else {
			c1 = d[0] + ',' + (d[1] - 1);
			c2 = d[0] + ',' + (d[1] + 1);
		}
		c1 = sets[c1];
		c2 = sets[c2];
		if (c1 === c2) {
			wall.push(d);
		} else {
			open.push(d);
			Object.keys(sets).forEach(function (key) {
				if (sets[key] === c2) {
					sets[key] = c1;
				}
			});
		}
	}
	return open;
}

function generateLevel (x, y, maze, centerExit) {
	var rooms, corridors;
	if (x === -1) {
		x = rand(0, LEVEL_W_2 - 1);
		y = rand(0, LEVEL_H_2 - 1);
	} else {
		x--;
		y--;
	}
	if (maze) {
		maze = generateMaze(LEVEL_W_2 - 1 - LEVEL_W_2 % 2, LEVEL_H_2 - 1 - LEVEL_H_2 % 2);
		return mazeToMap(maze, x, y);
	}
	rooms = generateRooms(x, y);
	corridors = generateCorridors(rooms);
	return roomsToMap(rooms, corridors, x, y, centerExit);
}

/*
TODO It would be nice to have levels with rooms and mazes together.
To do so, create one big room with even x, y, and odd w, h
Create rooms left and right of it, connect them independently.
Then connect the big room to one room on the left, and one on the right.
Constract a maze inside the big room.
*/

/*function test () {
	document.getElementById('output').textContent = generateLevel(-1, -1);
}

test();*/

return generateLevel;

})();