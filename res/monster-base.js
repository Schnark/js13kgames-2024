/*global MonsterBase: true*/
/*global log*/
MonsterBase =
(function () {
"use strict";

//base for Monster and Player
function MonsterBase () {
}

MonsterBase.draw = {
	'@': function (ctx) {
		ctx.fillStyle = 'blue';
		ctx.fillRect(4, 4, 8, 8);
	},
	'x': function (ctx) {
		ctx.fillStyle = 'green';
		ctx.fillRect(4, 4, 8, 8);
	}
};

MonsterBase.prototype.drawHealth = function (ctx, w, h) {
	var relHealth = this.health / this.maxHealth, color, w2;
	color = 'hsl(' + Math.round(140 * relHealth * relHealth) + ',100%,30%)';
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, w, h);
	ctx.fillStyle = '#000';
	w2 = Math.round((w - 2) * (1 - relHealth));
	ctx.fillRect(w - w2 - 1, 1, w2, h - 2);
	return color;
};

MonsterBase.prototype.draw = function (canvas) {
	MonsterBase.draw[this.type](canvas.ctx);
	if (this.type !== '@' && this.health < this.maxHealth) {
		canvas.ctx.translate(2, 2);
		this.drawHealth(canvas.ctx, 12, 4);
	}
};

MonsterBase.prototype.moveTo = function (x, y) {
	this.x = x;
	this.y = y;
};

MonsterBase.prototype.moveRel = function (dx, dy) {
	var x = this.x + dx, y = this.y + dy, monster;
	monster = this.level.monsterAt(x, y);
	if (monster) {
		this.attack(monster);
		return true;
	}
	if (this.level.isOpen(x, y)) {
		this.moveTo(x, y);
		return true;
	}
	return false;
};

MonsterBase.prototype.attack = function (target, ranged) {
	if (target.health === 0) {
		return;
	}
	//TODO
	if (ranged) {
		log('you try to hit ' + target.getDesc(true) + ', but you miss.');
		return;
	}
	if (this.type === '@') {
		log('you hit ' + target.getDesc(true) + '.');
	} else {
		log(this.getDesc(true) + ' hits you.');
	}
	target.health -= 1;
	if (target.health <= 0) {
		target.health = 0;
		target.die();
	}
};

MonsterBase.prototype.die = function () {
	if (this.type === '@') {
		log('you are out of luck and lose the game.');
	} else {
		log(this.getDesc(true) + ' vanishes.');
		this.level.removeMonster(this);
	}
};

return MonsterBase;
})();