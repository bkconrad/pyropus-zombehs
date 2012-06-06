var Renderer = require('./renderer');

function Player (data) {
  var i;
  this.id = data ? data.id : Player.idIndex++;
  data = data || {};
  if (data.cn !== undefined) {
    this.cn = data.cn;
  } else {
    for (i = 0; i < Player.list.length; i++) {
      if (Player.list[i] == undefined)
        break;
    }
    this.cn = i;
  }

  this.name = data.name || "player" + new Date().getTime();
  this.socket = data.socket || null;
  this.speed = 100;

  if (data.ent) {
    this.ent = Player.physics.create(data.ent);
  } else {
    this.ent = Player.physics.create({
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: 32,
      height: 32,
      static: false
    });
  }
}

Player.idIndex = 1;

Player.init = function (physics) {
  Player.physics = physics;
}

/**
 * reserve a spot for this player without adding him to the player list
 */
Player.prototype.reserve = function () {
  Player.list[this.cn] = true;
}

Player.prototype.add = function () {
  Player.list[this.cn] = this;

  if (Renderer)
    this.sprite = Renderer.add(this.ent, 'fighter');
};

Player.prototype.serialize = function () {
  return {
    cn: this.cn,
    id: this.id,
    ent: this.ent.serialize(),
    sprite: this.sprite,
    name: this.name
  };
};

Player.prototype.drop = function () {
  var i;
  Player.physics.drop(this.ent);
  if (Renderer)
    Renderer.drop(this.sprite);
  Player.list[this.cn] = undefined;
};

/**
 * Update player state from serialized data
 */
Player.prototype.update = function (data) {
    this.cn = data.cn;
    this.ent.modify(data.ent);
    this.sprite = data.sprite || this.sprite;
    this.name = data.name;
};

Player.list = [];

module.exports = Player;
