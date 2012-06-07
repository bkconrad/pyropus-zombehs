var SimplePhysics = require ('./simplephysics')
  , Renderer = require('./renderer');

function Being (ent) {
}

Being.idIndex = 1;

/**
 * return a partially-built Being suitable for serialization
 */
Being.prototype.createBeing = function (ent, type) {
  this.name = "being" + new Date().getTime();
  this.id = Being.idIndex;
  this.type = type || 'fighter';
  Being.idIndex += 1;

  this.speed = 100;

  if (ent) {
    this.ent = ent;
  } else {
    this.ent = {
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: 32,
      height: 32,
      static: false
    };
  }

  return this;
}

Being.prototype.addBeing = function () {
  this.ent = SimplePhysics.create(this.ent);

  if (Renderer) {
    this.sprite = Renderer.add(this.ent, this.type);
  }
  
  return this;
};

Being.prototype.dropBeing = function () {
  SimplePhysics.drop(this.ent);

  if (Renderer) {
    Renderer.drop(this.sprite);
  }

  return this;
};

Being.prototype.walk = function (direction) {
  this.ent.xvel = direction == 'left' ? -this.speed : this.speed;
};

module.exports = Being;
