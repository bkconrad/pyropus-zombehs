function Entity (data) {
  var p;
  for (p in data) {
    this[p] = data[p];
  }

  this.id = Entity.index++;
}

Entity.index = 1;

Entity.prototype = {
  x: 0,
  y: 0,
  xvel: 0,
  yvel: 0,
  width: 0,
  height: 0,
  update: function (dt) {
    this.x += this.xvel * dt / 1000;
    this.y += this.yvel * dt / 1000;
  },
  /**
   * @brief get AABB
   * @return an object with two point properties (xy1 and xy2) representing the
   * bounding box of this Entity.
   */
  bounds: function () {
    return {
      xy1: {
        x: this.x - this.width/2,
        y: this.y - this.height/2
      },
      xy2: {
        x: this.x + this.width/2,
        y: this.y + this.height/2
      }
    };
  }
};

var SimplePhysics = (function () {
  var entList = []
    , collisionList = []
    , gravity = 0
    ;

  function create (data) {
    var ent = new Entity(data);
    return addEntity(ent);
  }
  
  function addEntity (ent) {
    entList.push(ent);
    return ent;
  }

  function dropEntity (ent) {
    var i;
    for (i in entList) {
      if (entList[i] == ent) {
        entList.splice(i, 1);
        return;
      }
    }
  }

  function update (dt) {
    var i;
    collisionList = [];

    // update loop
    for (i in entList) {
      entList[i].update(dt);
    }

    // collision detection loop
    for (i in entList) {
      findCollisions(entList[i]);
    }

    // handle collisions
    for (i in collisionList) {
      dropEntity(collisionList[i][0]);
      dropEntity(collisionList[i][1]);
    }
  }

  function findCollisions (ent) {
    var i;
    for (i in entList) {
      // comparing id's is a simple way to only add each collision one time.
      if (ent.id < entList[i].id && testCollision(ent, entList[i]))
        collisionList.push([ent, entList[i]]);
    }
  }

  /**
   * @brief checks intersection of the AABB of two entities
   * @returns true if a collision is detected
   */
  function testCollision (ent1, ent2) {
    var aabb1 = ent1.bounds(),
        aabb2 = ent2.bounds();

    if (ent1 == ent2)
      return false;

    if (aabb1.xy1.x > aabb2.xy2.x)
      return false;

    if (aabb1.xy1.y > aabb2.xy2.y)
      return false;

    if (aabb1.xy2.x < aabb2.xy1.x)
      return false;

    if (aabb1.xy2.y < aabb2.xy1.y)
      return false;

    return true;
  }

  return {
    entList: entList,
    update: update,
    create: create
  };

})();

try {
  module.exports = SimplePhysics;
} catch (e) { }
