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
	var type, msg;
	this.x = x;
	this.y = y;
	if (this.type === '@') {
		type = this.level.getType(x, y);
		if (type === '%') {
			msg = 'you found a four-leave clover, ';
			if (this.health === this.maxHealth) {
				msg += 'but you leave it here for later.';
			} else {
				this.level.takeItem(x, y);
				this.health += 7;
				if (this.health > this.maxHealth) {
					this.health = this.maxHealth;
				}
				msg += 'which' + (this.health === this.maxHealth ? '' : ' partially') + ' restores your luck.';
			}
			log(msg);
		} else if (type === '*') {
			this.luckyCharms++;
			this.level.takeItem(x, y);
			log('you found a lucky charm.');
		}
	}
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

MonsterBase.prototype.rangedFails = function (d) {
	return Math.random() < (Math.pow(1.5, d / 2) - 1) / this.experience;
};

MonsterBase.prototype.blockAttack = function () {
	return Math.random() < this.block * this.experience;
};

MonsterBase.prototype.getAttackDamage = function () {
	return Math.round((this.minAttack + Math.random() * (this.maxAttack - this.minAttack)) * this.experience);
};

//only used for player
MonsterBase.prototype.improveExperience = function (maxTargetHealth) {
	var newExperience = this.experience * Math.pow(2, maxTargetHealth / 500);
	if (Math.floor(newExperience * 10) !== Math.floor(this.experience * 10)) {
		log('you feel more experienced now.');
	}
	this.experience = newExperience;
};

MonsterBase.prototype.attack = function (target, ranged) {

	function dist (a, b) {
		var x = a.x - b.x, y = a.y - b.y;
		return Math.sqrt(x * x + y * y);
	}

	if (target.health === 0) {
		return;
	}
	if (ranged && this.rangedFails(dist(target, this))) {
		if (this.type === '@') {
			log('you try to hit ' + target.getDesc(true) + ', but miss.');
		} else {
			log(this.getDesc(true) + ' tries to hit you, but misses.');
		}
		return;
	}
	if (target.blockAttack()) {
		if (this.type === '@') {
			log('you try to hit ' + target.getDesc(true) + ', but your attack is blocked.');
		} else {
			log(this.getDesc(true) + ' tries to hit you, but you block the attack.');
		}
		return;
	}
	if (this.type === '@') {
		log('you hit ' + target.getDesc(true) + '.');
	} else {
		log(this.getDesc(true) + ' hits you.');
	}
	target.health -= this.getAttackDamage();
	if (target.health <= 0) {
		target.health = 0;
		target.die();
		if (this.type === '@') {
			this.improveExperience(target.maxHealth);
		}
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