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

/**
 * Given data from Player#serialize, create or update a player
 */
Player.fromData = function (data) {
  var player
    ;

  if (Player.list[data.cn] instanceof Player) {
    Player.list[data.cn].drop();
  }

  player = new Player (data);

  player.createBeing();

  player.sprite = data.sprite || player.sprite;
  player.ent = data.ent || player.ent;
  player.name = data.name || player.name;
  player.id = data.id || player.id;
  player.identity = data.identity;

  player.add();

  if (player.identity) {
    Player.me = player;
  }

  return player;
};

Player.me = undefined;

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
  result.identity = this.identity;
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
