var Being = require('./being');

function Player (data) {
  var i;
  data = data || {};

  if (data.cn !== undefined) {
    this.cn = data.cn;
  } else {
    for (i = 0; i < Player.list.length; i++) {
      if (Player.list[i] == undefined) {
        break;
      }
    }
    this.cn = i;
  }

  this.socket = data.socket || null;

}

Player.unserialize = function (data) {
  var player;

  // find referenced Player, or make a new one
  if (data.cn && Player.list[data.cn] !== undefined && Player.list[data.cn] !== true) {
    player = Player.list[data.cn];
  } else {
    player = new Player (data);
  }

  // initialize one
  player.createBeing();

  // update it
  player.name = data.name || player.name;
  player.id = data.id || player.id;
  player.sprite = data.sprite || player.sprite;
  player.ent = data.ent || player.ent;

  // add it
  player.add();

  return player;
};

Player.prototype = Being.prototype;

Player.idIndex = 1;

/**
 * reserve a spot for this player without adding him to the player list
 */
Player.prototype.reserve = function () {
  Player.list[this.cn] = true;
  return this.createBeing();
}

Player.prototype.add = function () {
  Player.list[this.cn] = this;
  return this.addBeing();
};

Player.prototype.serialize = function () {
  var result = this.serializeBeing();
  result.cn = this.cn;
  return result;
};

Player.prototype.drop = function () {
  Player.list[this.cn] = undefined;
  this.dropBeing();
};

/**
 * Update player state from serialized data
 */
Player.prototype.update = function (data) {
    this.cn = data.cn;
    this.ent.modify(data.ent);
    this.sprite = data.sprite || this.sprite;
};

Player.list = [];

module.exports = Player;
