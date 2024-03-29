var SimplePhysics = (function () {

  /**
   * A physical entity
   */
  function Entity (data) {
    var p, i;
    if (data) {
      for (p in data) {
        this[p] = data[p];
      }
    }

    if (!(this.id >= 0)) {

      for (i = 0; i < entList.length; i++) {
        if (!entList[i])
          break;
      }

      this.id = i;
    }
  }

  Entity.prototype = {
    x: 0,
    y: 0,
    xvel: 0,
    yvel: 0,
    width: 0,
    height: 0,
    static: false,
    listener: false,
    supported: false,
    handlers: [],
    id: undefined,
    update: function (dt) {
      if (this.static)
        return;

      this.x += this.xvel * dt / 1000;
      this.y += this.yvel * dt / 1000;

      if (!this.supported)
        this.yvel += gravity;

      if (this.y > groundLevel) {
        this.supported = true;
        this.y = groundLevel;
      }
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
    },
    serialize: function () {
      return {
        x: this.x,
        y: this.y,
        xvel: this.xvel,
        yvel: this.yvel,
        width: this.width,
        height: this.height,
        static: this.static,
        supported: this.supported,
        id: this.id
      };
    },
    modify: function (data) {
      var i;
      for (i in data) {
        this[i] = data[i];
      }
    }
  };

  var entList = []
    , collisionList = []
    , gravity = 10
    , groundLevel = 300;
    ;

  function create (data) {
    var ent = new Entity(data);
    return addEntity(ent);
  }
  
  function addEntity (ent) {
    entList[ent.id] = ent;
    return ent;
  }

  function dropEntity (ent) {
    entList[ent.id] = undefined;
  }

  function update (dt) {
    var i, collision;
    collisionList = [];

    // update loop
    for (i in entList) {
      if (entList[i])
        entList[i].update(dt);
    }

    // collision detection loop
    for (i in entList) {
      if (entList[i])
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

  /**
   * Returns a digest of the physics state for validation
   */
  function digest () {
    var i
      , result = 0xFFFFFFFF;
      ;
    for (i = 0; i < entList.length; i++) {
      result ^= entList[i].x;
      result ^= entList[i].y;
      result ^= entList[i].xvel;
      result ^= entList[i].yvel;
    }
    return result;
  }

  return {
    Entity: Entity,
    entList: entList,
    update: update,
    drop: dropEntity,
    digest: digest,
    create: create
  };

})();

try {
  module.exports = SimplePhysics;
} catch (e) { }
