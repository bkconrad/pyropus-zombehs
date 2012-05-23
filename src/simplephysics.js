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
  render: function () {
    console.log(x,y,xvel,yvel);
  }
};

var SimplePhysics = (function () {
  var entList = []
    , gravity = 0
    ;
  
  function addEntity (ent) {
    entList.push(ent);
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
  }

})();

try {
  module.exports = SimplePhysics;
} catch (e) { }
