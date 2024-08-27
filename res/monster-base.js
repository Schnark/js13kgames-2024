/*global MonsterBase: true*/
/*global Canvas, log*/
MonsterBase =
(function () {
"use strict";

//base for Monster and Player
function MonsterBase () {
}

MonsterBase.draw = {
	'@': function (ctx, sprites) {
		ctx.drawImage(sprites[9], 0, 0);
	},
	'@2': function (ctx, sprites) {
		ctx.drawImage(sprites[10], 0, 0);
	},
	':1': function (ctx, sprites) {
		ctx.drawImage(sprites[11], 0, 0);
	},
	':2': function (ctx, sprites) {
		ctx.drawImage(sprites[11], 0, 0);
	},
	':3': function (ctx, sprites) {
		ctx.drawImage(sprites[11], 0, 0);
	},
	'f1': function (ctx, sprites) {
		ctx.drawImage(sprites[12], 0, 0);
	},
	'f2': function (ctx, sprites) {
		ctx.drawImage(sprites[12], 0, 0);
	},
	'f3': function (ctx, sprites) {
		ctx.drawImage(sprites[12], 0, 0);
	},
	'B1': function (ctx, sprites) {
		ctx.drawImage(sprites[13], 0, 0);
	},
	'B2': function (ctx, sprites) {
		ctx.drawImage(sprites[13], 0, 0);
	},
	'B3': function (ctx, sprites) {
		ctx.drawImage(sprites[13], 0, 0);
	},
	'n': function (ctx, sprites) {
		ctx.drawImage(sprites[14], 0, 0);
	},
	'&1': function (ctx, sprites) {
		ctx.drawImage(sprites[15], 0, 0);
	},
	'&2': function (ctx, sprites) {
		ctx.drawImage(sprites[16], 0, 0);
	}
};

MonsterBase.prototype.init = function (data) {
	this.health = data.health || 10;
	this.maxHealth = data.health || 10;
	this.experience = data.experience || 1;
	this.block = data.block || 0.1;
	this.minAttack = data.minAttack || 1;
	this.maxAttack = data.maxAttack || 2;
	if (data.speed) {
		this.speed = 1 / data.speed;
	}
	this.aiMode = data.aiMode;
	if (data.desc) {
		this.desc = JSON.parse(JSON.stringify(data.desc));
	}
	this.attackName = data.attackName;
};

MonsterBase.prototype.place = function (x, y, level) {
	this.x = x;
	this.y = y;
	this.level = level;
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
	MonsterBase.draw[this.type](canvas.ctx, canvas.sprites);
	if (!this.isPlayer && this.health < this.maxHealth) {
		canvas.ctx.translate(2, 2);
		this.drawHealth(canvas.ctx, 12, 4);
	}
};

MonsterBase.prototype.moveTo = function (x, y) {
	var type, taken;
	this.x = x;
	this.y = y;
	if (this.isPlayer) {
		type = this.level.getType(x, y);
		if (type !== ' ') {
			taken = this.handleItem(type);
			if (taken) {
				this.level.takeItem(x, y);
			}
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
	return Math.random() < (Math.pow(1.3, d / 2) - 1) / this.experience;
};

MonsterBase.prototype.blockAttack = function () {
	return Math.random() < this.block * this.experience * (this.hasHorseshoe && !this.usesHorseshoe ? 3 : 1);
};

MonsterBase.prototype.getAttackDamage = function () {
	return Math.round((this.minAttack + Math.random() * (this.maxAttack - this.minAttack)) * this.experience);
};

//only used for player
MonsterBase.prototype.improveExperience = function (maxTargetHealth) {
	var newExperience;
	if (this.luckyMushroomTimeout) {
		this.experience /= 2;
	}
	newExperience = this.experience * Math.pow(2, maxTargetHealth / 500);
	if (newExperience > 2) {
		newExperience = 2;
	}
	if (Math.floor(newExperience * 10) !== Math.floor(this.experience * 10)) {
		log('you feel more experienced now.', 'b');
	}
	this.experience = newExperience;
	if (this.luckyMushroomTimeout) {
		this.experience *= 2;
	}
};

MonsterBase.prototype.getAttackName = function (ranged, failed) {
	var msg;
	if (this.isPlayer) {
		if (ranged) {
			msg = this.hasHorseshoe ? 'throw your horseshoe at' : 'yell your lucky number at';
		} else {
			msg = 'hit';
		}
		if (failed) {
			msg = 'try to ' + msg;
		}
		return 'you ' + msg + ' ';
	} else {
		if (this.attackName) {
			msg = this.attackName[failed ? 0 : 1];
		} else {
			msg = failed ? 'tries to attack' : 'attacks';
		}
		return this.getDesc(true) + ' ' + msg + ' ';
	}
};

MonsterBase.prototype.attack = function (target, ranged) {
	var died;

	function dist (a, b) {
		var x = a.x - b.x, y = a.y - b.y;
		return Math.sqrt(x * x + y * y);
	}

	if (target.health === 0) {
		return;
	}
	if (ranged) {
		Canvas.addAnimation(this.x, this.y, target.x, target.y, this.hasHorseshoe);
	}
	if (ranged && this.rangedFails(dist(target, this))) {
		if (this.isPlayer) {
			log(this.getAttackName(true, true) + target.getDesc(true) + ', but miss.');
		} else {
			log(this.getAttackName(true, true) + 'you, but misses.');
		}
		return;
	}
	if (ranged && this.hasHorseshoe && target.type === 'n') {
		log('uh-oh! The mirror-monster shatters!', 'b');
		target.level.removeMonster(target);
		this.reduceHealth(20);
		return;
	}
	if (target.blockAttack()) {
		if (this.isPlayer) {
			log(this.getAttackName(ranged, true) + target.getDesc(true) + ', but your attack is blocked.');
		} else {
			log(this.getAttackName(ranged, true) + 'you, but you block the attack.');
		}
		return;
	}
	if (this.isPlayer) {
		log(this.getAttackName(ranged) + target.getDesc(true) + '.');
	} else {
		log(this.getAttackName(ranged) + 'you.');
		if (this.type.charAt(0) === 'B' && Math.random() < 0.2) {
			log(this.getDesc(true) + ' hits your eyes.');
			target.makeBlind();
		}
	}
	died = target.reduceHealth(this.getAttackDamage());
	if (died && this.isPlayer) {
		this.improveExperience(target.maxHealth);
	}
};

MonsterBase.prototype.reduceHealth = function (damage) {
	this.health -= damage;
	if (this.health <= 0) {
		this.health = 0;
		this.die();
		return true;
	}
};

MonsterBase.prototype.die = function () {
	if (this.isPlayer) {
		log('you are out of luck and lose the game.', 'b');
	} else {
		log(this.getDesc(true) + ' vanishes.', 'b');
		if (this.type === '&2') {
			this.level.takeItem(this.x, this.y, '*');
			//NOTE when we are on a ladder, this will remove the ladder
			//and if there are still charms above you will lose the game
			//but this is very rare and the ladder might have been destroyed
			//during the fight
			log(this.getDesc(true) + ' left back a lucky charm!', 'b');
		}
		this.level.removeMonster(this);
	}
};

return MonsterBase;
})();