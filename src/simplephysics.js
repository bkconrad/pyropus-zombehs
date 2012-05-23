function Entity (data) {
  var p;
  for (p in data) {
    this[p] = data[p];
  }
}

Entity.prototype = {
  x: 0,
  y: 0,
  xvel: 0,
  yvel: 0,
  update: function () {
    this.x += this.xvel;
    this.y += this.yvel;
  }
};

var SimplePhysics = (function () {
  var entList = []
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
      entList[i].update();
    }
  }

})();

try {
  module.exports = SimplePhysics;
} catch (e) { }
