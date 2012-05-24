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
    for (i in entList) {
      entList[i].update(dt);
      findCollisions(entList[i]);
    }
  }

  function findCollisions (ent) {
    for (var i in entList) {
      if (testCollision(ent, entList[i]))
        console.log(ent, "hit", entList[i]);
    }
  }

  function testCollision (ent1, ent2) {
    if (ent1 == ent2)
      return false;

    if ((Math.abs(ent1.x - ent2.x) < (ent1.width + ent2.width) / 2) &&
        (Math.abs(ent1.y - ent2.y) < (ent1.height + ent2.height) / 2)) {
      collisionList.push([ent1, ent2]);
      return true;
    }
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
