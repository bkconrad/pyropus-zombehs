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
  static: false,
  listener: false,
  handlers: [],
  update: function (dt) {
    if (this.static)
      return;

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
  },
  /**
   * @brief add a handler function to be executed when this ent collides with
   * another. the handler function receives a reference to the other ent as its
   * first argument, and is called as with this ent as "this"
   */
  addHandler: function (handler) {
    this.listener = true;
    if (typeof handler === 'function') {
      this.handlers.push(handler);
    }
  },
  /**
   * @brief call all collision handlers on this object
   */
  collide: function (ent) {
    var i;
    for (i in this.handlers) {
      this.handlers[i].call(this, ent);
    }
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
    var i, collision;
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
      collision = collisionList[i];
      collision[0].collide(collision[1]);
      collision[1].collide(collision[0]);
      
      // collision[0].static XOR collision[1].static
      if (collision[0].static ? !collision[1].static : collision[1].static) {
      }
    }
  }

  /**
   * @brief add a collision between two entities if one hasn't been added yet
   * @return true on success, false on collision already exists
   */
  function addCollision(ent1, ent2) {
    var id,
        i;

    // create a unique & reproducible id for enforcing collission uniqueness
    if (ent1.id < ent2.id) {
      id = (ent1.id << 16) + ent2.id;
    } else {
      id = (ent2.id << 16) + ent1.id;
    }

    // bail if event has already been added
    for (i in collisionList) {
      if (id == collisionList[i].id)
        return false;
    }

    collisionList.push({
      0: ent1,
      1: ent2,
      id: id
    });

    return true;
  }

  function findCollisions (ent) {
    if (!ent.listener)
      return;
    var i;
    for (i in entList) {
      if (testCollision(ent, entList[i])) {
        addCollision(ent, entList[i]);
      }
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
    drop: dropEntity,
    create: create
  };

})();

try {
  module.exports = SimplePhysics;
} catch (e) { }
