var SimplePhysics = require ('./simplephysics')
  , Renderer = require('./renderer');

function Being (ent) {
}

Being.idIndex = 1;

/**
 * return a partially-built Being suitable for serialization and ready to be
 * added via #addBeing
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
      x: 200,
      y: 0,
      width: 32,
      height: 32,
      static: false
    };
  }

  return this;
}

/**
 * Add Being and associated data to Physics and Renderer
 */
Being.prototype.addBeing = function () {
  this.ent = SimplePhysics.create(this.ent);

  if (Renderer) {
    if (!this.sprite) {
      this.sprite = Renderer.add(this.ent, this.type);
    }
    this.sprite._ent = this.ent;
  }

  
  return this;
};

Being.prototype.serializeBeing = function () {
  var result = {
    id: this.id,
    name: this.name
  };

  // serialize ent if it is an Entity, otherwise pass it as-is
  if (this.ent instanceof SimplePhysics.Entity) {
    result.ent = this.ent.serialize();
  } else {
    result.ent = this.ent;
  }

  return result;
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
